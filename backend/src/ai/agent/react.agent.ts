import { getChatModel, getEmbeddingModel } from '../../infrastructure/llm';
import { getDbPool } from '../../infrastructure/database';
import { getRedisClient } from '../../infrastructure/cache';
import { config } from '../../config';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { checkInputGuardrail, checkOutputGuardrail } from '../guardrails';

// Check if we should run in mock mode
const isMockMode = !config.openai.apiKey || config.openai.apiKey.startsWith('sk-xxx');

export interface ChatAgentParams {
  message: string;
  shopId: string;
  productId: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Executes the AI Shopping Assistant ReAct loop, yielding tokens in real-time.
 */
export async function* runAgentStream(
  params: ChatAgentParams,
): AsyncGenerator<string, void, unknown> {
  const { message, shopId, productId, history = [] } = params;

  // 1. Run Input Guardrail check
  const inputCheck = await checkInputGuardrail(message);
  if (!inputCheck.allowed) {
    yield `[Guardrail Blocked] ${inputCheck.reason || 'Nội dung tin nhắn không hợp lệ.'}`;
    return;
  }

  if (isMockMode) {
    yield* runMockAgentStream(message, shopId, productId);
    return;
  }

  try {
    const db = getDbPool();
    const redis = await getRedisClient();

    // ── Define Tools with dynamic closure binding shopId/productId ─────────────────
    const checkStockTool = async (): Promise<string> => {
      const stock = await redis.get(`product:stock:${productId}`);
      if (stock === null) {
        return `Sản phẩm với ID ${productId} không có trong kho hệ thống Redis.`;
      }
      return `Sản phẩm hiện còn ${stock} chiếc trong kho Redis.`;
    };

    const getProductInfoTool = async (query: string): Promise<string> => {
      try {
        const embeddings = getEmbeddingModel();
        const embedding = await embeddings.embedQuery(query);
        const vectorStr = `[${embedding.join(',')}]`;

        // Cosine similarity search locked strictly to shopId
        const sql = `
          SELECT content FROM knowledge_docs
          WHERE shop_id = $1
          ORDER BY embedding <=> $2::vector
          LIMIT 2
        `;
        const res = await db.query(sql, [shopId, vectorStr]);
        if (res.rows.length === 0) {
          return 'Không tìm thấy tài liệu hướng dẫn hoặc thông số kỹ thuật nào phù hợp với câu hỏi này trong cơ sở dữ liệu của shop.';
        }
        return res.rows.map((row) => row.content).join('\n\n');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return `Lỗi truy vấn thông tin sản phẩm: ${errMsg}`;
      }
    };

    // ── Build Messages Thread ──────────────────────────────────────────────────────
    const systemInstruction = `
      Bạn là Trợ lý Mua sắm AI (AI Shopping Assistant) cực kỳ năng động và thân thiện cho một phiên livestream bán hàng.
      Nhiệm vụ của bạn là tư vấn thông tin sản phẩm, kiểm tra kho hàng và chốt đơn hàng cho khách.
 
      Thông tin ngữ cảnh hiện tại:
      - Shop ID của phiên live: ${shopId}
      - ID Sản phẩm đang ghim: ${productId}
 
      Bạn có quyền truy cập vào các công cụ sau:
      1. check_stock: Gọi khi khách hỏi về số lượng tồn kho còn lại của sản phẩm. Không yêu cầu tham số đầu vào.
      2. get_product_info: Gọi khi khách hỏi về tính năng, thông số kỹ thuật, cách sử dụng hoặc chi tiết sản phẩm. Yêu cầu tham số là một câu truy vấn tìm kiếm tiếng Việt ngắn gọn.
 
      Quy tắc ứng xử:
      - Chỉ trả lời tiếng Việt.
      - Câu trả lời ngắn gọn, súc tích, năng nổ phù hợp với không khí livestream sôi động.
      - KHÔNG ĐƯỢC trả lời hoặc suy đoán về các sản phẩm không thuộc Shop hiện tại để bảo mật dữ liệu đa khách thuê (multi-tenant).
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [new SystemMessage(systemInstruction)];

    // Add History
    for (const h of history) {
      if (h.role === 'user') {
        messages.push(new HumanMessage(h.content));
      } else {
        messages.push(new AIMessage(h.content));
      }
    }

    // Add current query
    messages.push(new HumanMessage(message));

    const chatModel = getChatModel();

    // Loop executing tool calls
    let loopCount = 0;
    const maxLoops = 5;

    while (loopCount < maxLoops) {
      loopCount++;

      // We bind tools to model so LLM can call them
      const modelWithTools = chatModel.bindTools([
        {
          type: 'function',
          function: {
            name: 'check_stock',
            description: 'Kiểm tra số lượng tồn kho thực tế của sản phẩm đang livestream.',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function',
          function: {
            name: 'get_product_info',
            description:
              'Lấy chi tiết thông số kỹ thuật, tính năng và thông tin sản phẩm từ cơ sở dữ liệu tri thức của shop.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Câu truy vấn mô tả đặc tính sản phẩm cần tìm kiếm.',
                },
              },
              required: ['query'],
            },
          },
        },
      ]);

      const response = await modelWithTools.invoke(messages);

      interface ToolCall {
        id: string;
        function: {
          name: string;
          arguments: string;
        };
      }

      // If LLM wants to call tools
      const toolCalls = response.additional_kwargs?.tool_calls as ToolCall[] | undefined;
      if (toolCalls && toolCalls.length > 0) {
        messages.push(response);

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[AI Agent] Invoking tool "${toolName}" with arguments:`, toolArgs);

          let toolResult = '';
          if (toolName === 'check_stock') {
            toolResult = await checkStockTool();
          } else if (toolName === 'get_product_info') {
            toolResult = await getProductInfoTool(toolArgs.query || message);
          } else {
            toolResult = `Không tìm thấy công cụ tên là: ${toolName}`;
          }

          messages.push(
            new ToolMessage({
              content: toolResult,
              tool_call_id: toolCall.id,
            }),
          );
        }
      } else {
        // No tool calls needed, this is the final answer! Stream it with output guardrails!
        const responseStream = await chatModel.stream(messages);
        let buffer = '';
        let yieldedLength = 0;

        for await (const chunk of responseStream) {
          if (chunk.content) {
            buffer += chunk.content.toString();
            const cleaned = await checkOutputGuardrail(buffer);
            const delta = cleaned.slice(yieldedLength);
            yieldedLength = cleaned.length;
            if (delta) {
              yield delta;
            }
          }
        }
        return;
      }
    }
    yield 'Xin lỗi bạn, trợ lý AI đang quá tải khi xử lý thông tin sản phẩm. Bạn vui lòng thử lại sau vài giây!';
  } catch (err: unknown) {
    console.error('[AI Agent] Error in ReAct execution loop:', err);
    yield* runMockAgentStream(message, shopId, productId);
  }
}

/**
 * Mock generator giving realistic stream typings for local development without OpenAI Key
 */
async function* runMockAgentStream(
  message: string,
  shopId: string,
  productId: string,
): AsyncGenerator<string, void, unknown> {
  console.log(`[AI Agent] Running in Mock Fallback Mode (Shop: ${shopId}, Product: ${productId})`);

  let responseText = '';
  const msgLower = message.toLowerCase();

  const db = getDbPool();
  const redis = await getRedisClient();

  if (
    msgLower.includes('còn hàng') ||
    msgLower.includes('stock') ||
    msgLower.includes('số lượng') ||
    msgLower.includes('kho')
  ) {
    // Query real Redis stock
    const stock = await redis.get(`product:stock:${productId}`);
    if (stock !== null) {
      responseText = `[Mock AI] Hiện tại sản phẩm này đang còn đúng ${stock} chiếc trong kho flash sale của Shop! Bạn hãy nhanh tay nhấn chốt đơn để không bỏ lỡ cơ hội nhé! ⚡`;
    } else {
      responseText = `[Mock AI] Mình đã kiểm tra hệ thống, sản phẩm này hiện chưa được cấu hình tồn kho trên Redis. Hãy liên hệ với streamer để biết chi tiết nhé!`;
    }
  } else if (
    msgLower.includes('spec') ||
    msgLower.includes('chi tiết') ||
    msgLower.includes('tính năng') ||
    msgLower.includes('thông số') ||
    msgLower.includes('đặc điểm') ||
    msgLower.includes('headphones') ||
    msgLower.includes('tai nghe')
  ) {
    // Query database product name / specs
    try {
      const dbRes = await db.query('SELECT name, price, description FROM products WHERE id = $1', [
        productId,
      ]);
      if (dbRes.rows.length > 0) {
        const prod = dbRes.rows[0];
        responseText = `[Mock AI] Sản phẩm **${prod.name}** đang có giá khuyến mãi cực ưu đãi chỉ **$${prod.price}**! Đặc điểm nổi bật: ${prod.description || 'Chất lượng tuyệt vời, tính năng ưu việt, thiết kế ấn tượng.'}`;
      } else {
        responseText = `[Mock AI] Sản phẩm này hiện tại chưa có thông số cụ thể trong Postgres. Tuy nhiên đây là dòng sản phẩm cực hot hiện tại!`;
      }
    } catch {
      responseText = `[Mock AI] Sản phẩm sở hữu chất lượng tuyệt hảo, tính năng cao cấp. Giá chỉ có ưu đãi trong phiên live hôm nay!`;
    }
  } else {
    responseText = `[Mock AI] Chào bạn! Mình là Trợ lý Mua sắm ảo của Shop. Bạn cần tư vấn về thông số kỹ thuật (specs) hay kiểm tra số lượng tồn kho (stock) còn lại của sản phẩm này? Mình sẵn sàng hỗ trợ bạn ngay!`;
  }

  // Stream text character by character with output guardrails applied in sliding window
  const chunkSize = 6;
  let buffer = '';
  let yieldedLength = 0;

  for (let i = 0; i < responseText.length; i += chunkSize) {
    const chunk = responseText.slice(i, i + chunkSize);
    buffer += chunk;
    const cleaned = await checkOutputGuardrail(buffer);
    const delta = cleaned.slice(yieldedLength);
    yieldedLength = cleaned.length;
    if (delta) {
      yield delta;
    }
    await new Promise((resolve) => setTimeout(resolve, 35));
  }
}
