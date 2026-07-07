import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';

// ── Embedding Model Singleton ──────────────────────────────────────────────
let embeddingModel: OpenAIEmbeddings;

export function getEmbeddingModel(): OpenAIEmbeddings {
  if (!embeddingModel) {
    embeddingModel = new OpenAIEmbeddings({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.embeddingModel, // text-embedding-3-small
      dimensions: 1536,
    });
  }
  return embeddingModel;
}

// ── Chat LLM Singleton ─────────────────────────────────────────────────────
let chatModel: ChatOpenAI;

export function getChatModel(): ChatOpenAI {
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: config.openai.llmModel, // gpt-4o-mini
      temperature: 0.3,
      streaming: true, // stream tokens back to client
      timeout: 8000, // 8s timeout — fail fast in livestream context
    });
  }
  return chatModel;
}
