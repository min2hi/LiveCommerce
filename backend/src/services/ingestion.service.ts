import { getEmbeddingModel } from '../infrastructure/llm';
import { getDbPool } from '../infrastructure/database';

export class IngestionService {
  /**
   * Chunks a document content, generates embeddings, and saves to knowledge_docs.
   */
  async ingestDocument(shopId: string, content: string): Promise<void> {
    if (!shopId || !content.trim()) {
      throw new Error('Shop ID and content must not be empty');
    }

    // Split content into chunks of roughly 500 characters, with 100 character overlap
    const chunks = this.chunkText(content, 500, 100);
    const embeddings = getEmbeddingModel();
    const db = getDbPool();

    for (const chunk of chunks) {
      const cleanedChunk = chunk.trim();
      if (!cleanedChunk) continue;

      // 1. Generate embedding vector
      let embeddingVector: number[] = new Array(1536).fill(0);
      try {
        embeddingVector = await embeddings.embedQuery(cleanedChunk);
      } catch {
        console.warn(
          '[IngestionService] Failed to generate embedding (OpenAI Key might be mock). Using zero-vector fallback.',
        );
      }

      // Convert vector to string representation for postgres vector type, e.g. '[0.1, 0.2, ...]'
      const vectorStr = `[${embeddingVector.join(',')}]`;

      // 2. Insert into PostgreSQL pgvector table
      const query = `
        INSERT INTO knowledge_docs (shop_id, content, embedding)
        VALUES ($1, $2, $3::vector)
      `;
      await db.query(query, [shopId, cleanedChunk, vectorStr]);
    }
    console.log(
      `[IngestionService] Successfully ingested document into ${chunks.length} chunks for shop: ${shopId}`,
    );
  }

  private chunkText(text: string, size: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = start + size;
      chunks.push(text.slice(start, end));
      start += size - overlap;
    }
    return chunks;
  }
}
