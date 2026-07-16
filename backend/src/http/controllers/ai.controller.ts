import type { Request, Response } from 'express';
import { runAgentStream } from '../../ai/agent/react.agent';
import { IngestionService } from '../../services/ingestion.service';
import { SystemMonitor } from '../../infrastructure/system-monitor';

export class AiController {
  private readonly ingestionService = new IngestionService();

  /**
   * HTTP POST /api/knowledge/ingest
   * Ingests documentation chunks with vector embeddings.
   */
  ingest = async (req: Request, res: Response): Promise<void> => {
    const { shopId, content } = req.body;

    if (!shopId || !content) {
      res.status(400).json({ error: 'Missing shopId or content in request body.' });
      return;
    }

    try {
      await this.ingestionService.ingestDocument(shopId, content);
      res.status(201).json({
        status: 'success',
        message: 'Knowledge document successfully chunked, vectorized, and ingested.',
      });
    } catch (err: unknown) {
      console.error('[AiController] Ingestion failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to ingest knowledge document.', details: message });
    }
  };

  /**
   * HTTP GET /api/ai/debug/stress
   * Intentionally spikes CPU to > 90% for 5-10 seconds to test Graceful Degradation.
   */
  stressTest = async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: 'CPU Stress test started. Backend will be unresponsive for ~10 seconds.' });
    
    // Asynchronously block the event loop heavily
    setTimeout(() => {
      const end = Date.now() + 10000; // 10 seconds
      while (Date.now() < end) {
        // Spin lock
        Math.random() * Math.random();
      }
    }, 100);
  };

  /**
   * HTTP POST /api/ai/chat
   * Streams ReAct agent responses token-by-token using HTTP chunked encoding.
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    const { message, shopId, productId, history } = req.body;

    if (!message || !shopId || !productId) {
      res.status(400).json({ error: 'Missing required parameters: message, shopId, productId' });
      return;
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    if (SystemMonitor.isDegraded()) {
      res.write('Hệ thống AI đang tạm thời vô hiệu hóa để ưu tiên luồng thanh toán do tải máy chủ quá cao. Vui lòng thử lại sau vài phút.');
      res.end();
      return;
    }

    try {
      const tokenStream = runAgentStream({
        message,
        shopId,
        productId,
        history,
      });

      for await (const token of tokenStream) {
        res.write(token);
      }
    } catch (err: unknown) {
      console.error('[AiController] Chat stream processing failed:', err);
      res.write('\n[Error: Assistant stream interrupted. Vui lòng thử lại sau.]');
    } finally {
      res.end();
    }
  };
}
