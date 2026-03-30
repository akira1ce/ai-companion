import type { MemoryDocument } from '@ai-companion/types';
import type { D1Binding, KVBinding, VectorizeBinding, EmbeddingFn } from './retriever.js';

export interface MemoryWriterDeps {
  db: D1Binding;
  kv: KVBinding;
  vectorize: VectorizeBinding;
  embedFn: EmbeddingFn;
}

export interface SessionContext {
  messages: Array<{ role: string; content: string }>;
}

export class MemoryWriter {
  constructor(private deps: MemoryWriterDeps) {}

  // Sync: write short-term session context to KV (non-blocking for caller)
  async writeSessionContext(userId: string, ctx: SessionContext): Promise<void> {
    const key = `session:${userId}`;
    await this.deps.kv.put(key, JSON.stringify(ctx), { expirationTtl: 60 * 60 * 24 });
  }

  async readSessionContext(userId: string): Promise<SessionContext> {
    const key = `session:${userId}`;
    const raw = await this.deps.kv.get(key);
    return raw ? (JSON.parse(raw) as SessionContext) : { messages: [] };
  }

  // Async: persist extracted memories to D1 and Vectorize (call without await to not block)
  async writeMemoryAsync(userId: string, docs: MemoryDocument[]): Promise<void> {
    await Promise.all(docs.map((doc) => this.writeOne(userId, doc)));
  }

  private async writeOne(userId: string, doc: MemoryDocument): Promise<void> {
    const metaStr = JSON.stringify(doc.metadata);
    // D1 write
    await this.deps.db
      .prepare(
        `INSERT OR REPLACE INTO memories (id, user_id, type, content, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(doc.id, userId, doc.type, doc.content, metaStr, doc.createdAt)
      .all();

    // Vectorize write (dual-write for event/keyword types)
    if (doc.type === 'event' || doc.type === 'keyword') {
      const vector = await this.deps.embedFn.embed(doc.content);
      // Vectorize upsert via REST is handled at the Workers layer;
      // here we expose a method for the API layer to call with the binding.
      await this.upsertVector(doc.id, vector, {
        userId,
        content: doc.content,
        createdAt: String(doc.createdAt),
        type: doc.type,
      });
    }
  }

  // Separated so the API layer can pass the actual VectorizeIndex.upsert binding
  private async upsertVector(
    id: string,
    vector: number[],
    metadata: Record<string, string>,
  ): Promise<void> {
    // @ts-expect-error — VectorizeIndex.upsert is not in the minimal interface;
    // the real Cloudflare binding will have this method.
    await (this.deps.vectorize as { upsert: Function }).upsert([{ id, values: vector, metadata }]);
  }
}
