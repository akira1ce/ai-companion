import type { MemoryDocument, RetrievalQuery } from '@ai-companion/types';

// Minimal storage interfaces — implemented by Cloudflare bindings in the API layer
export interface VectorizeBinding {
  query(vector: number[], options: { topK: number; filter?: Record<string, string> }): Promise<{
    matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
  }>;
}

export interface D1Binding {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
}

export interface KVBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface EmbeddingFn {
  embed(text: string): Promise<number[]>;
}

export interface HybridRetrieverDeps {
  vectorize: VectorizeBinding;
  db: D1Binding;
  kv: KVBinding;
  embedFn: EmbeddingFn;
}

export interface FusionWeights {
  semantic: number;
  structured: number;
  temporal: number;
  keyword: number;
}

const DEFAULT_WEIGHTS: FusionWeights = {
  semantic:    0.35,
  structured:  0.30,
  temporal:    0.20,
  keyword:     0.15,
};

export class HybridRetriever {
  constructor(
    private deps: HybridRetrieverDeps,
    private weights: FusionWeights = DEFAULT_WEIGHTS,
  ) {}

  async retrieve(query: RetrievalQuery): Promise<MemoryDocument[]> {
    const topK = query.topK ?? 5;

    // Parallel 4-channel retrieval
    const [semantic, structured, temporal, keyword] = await Promise.allSettled([
      this.semanticChannel(query, topK * 2),
      this.structuredChannel(query, topK * 2),
      this.temporalChannel(query, topK),
      this.keywordChannel(query, topK * 2),
    ]);

    const results: Map<string, { doc: MemoryDocument; score: number }> = new Map();

    const merge = (docs: MemoryDocument[], weight: number) => {
      for (const doc of docs) {
        const base = doc.score ?? 0;
        const existing = results.get(doc.id);
        if (existing) {
          existing.score += base * weight;
        } else {
          results.set(doc.id, { doc, score: base * weight });
        }
      }
    };

    if (semantic.status === 'fulfilled')   merge(semantic.value,   this.weights.semantic);
    if (structured.status === 'fulfilled') merge(structured.value, this.weights.structured);
    if (temporal.status === 'fulfilled')   merge(temporal.value,   this.weights.temporal);
    if (keyword.status === 'fulfilled')    merge(keyword.value,    this.weights.keyword);

    return [...results.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ doc, score }) => ({ ...doc, score }));
  }

  // Channel 1: semantic vector search
  private async semanticChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
    const vector = await this.deps.embedFn.embed(query.text);
    const res = await this.deps.vectorize.query(vector, {
      topK: k,
      filter: { sessionId: query.sessionId },
    });
    return res.matches.map((m) => ({
      id: m.id,
      type: 'event',
      content: String(m.metadata?.content ?? ''),
      metadata: m.metadata ?? {},
      createdAt: Number(m.metadata?.createdAt ?? 0),
      score: m.score,
    }));
  }

  // Channel 2: structured D1 fact/profile query
  private async structuredChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
    const rows = await this.deps.db
      .prepare(
        `SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND type IN ('fact', 'profile')
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .bind(query.sessionId, k)
      .all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

    return rows.results.map((r) => ({
      id: r.id,
      type: r.type as MemoryDocument['type'],
      content: r.content,
      metadata: JSON.parse(r.metadata ?? '{}'),
      createdAt: r.created_at,
      score: 1.0,
    }));
  }

  // Channel 3: time-range summary query
  private async temporalChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
    const rows = await this.deps.db
      .prepare(
        `SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND type = 'summary'
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .bind(query.sessionId, k)
      .all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

    return rows.results.map((r) => ({
      id: r.id,
      type: 'summary' as const,
      content: r.content,
      metadata: JSON.parse(r.metadata ?? '{}'),
      createdAt: r.created_at,
      score: 0.8,
    }));
  }

  // Channel 4: keyword full-text search
  private async keywordChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
    const terms = query.text.split(/\s+/).filter(Boolean).slice(0, 5);
    if (terms.length === 0) return [];

    const conditions = terms.map(() => 'content LIKE ?').join(' OR ');
    const bindings = terms.map((t) => `%${t}%`);

    const rows = await this.deps.db
      .prepare(
        `SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND (${conditions})
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .bind(query.sessionId, ...bindings, k)
      .all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

    return rows.results.map((r) => ({
      id: r.id,
      type: r.type as MemoryDocument['type'],
      content: r.content,
      metadata: JSON.parse(r.metadata ?? '{}'),
      createdAt: r.created_at,
      score: 0.6,
    }));
  }
}
