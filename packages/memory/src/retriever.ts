import type { MemoryDocument, RetrievalQuery } from "@ai-companion/types";

// 向量存储接口 — 由 Cloudflare 绑定在 API 层实现
export interface VectorizeBinding {
	query(
		vector: number[],
		options: { topK: number; filter?: Record<string, string> }
	): Promise<{
		matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
	}>;
}

// D1 数据库接口
export interface D1Binding {
	prepare(sql: string): {
		bind(...args: unknown[]): {
			all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
		};
	};
}

// KV 存储接口
export interface KVBinding {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// 文本嵌入接口
export interface EmbeddingFn {
	embed(text: string): Promise<number[]>;
}

// 混合检索器依赖接口
export interface HybridRetrieverDeps {
	vectorize: VectorizeBinding;
	db: D1Binding;
	kv: KVBinding;
	embedFn: EmbeddingFn;
}

// 融合权重接口
export interface FusionWeights {
	semantic: number;
	structured: number;
	temporal: number;
	keyword: number;
}

// 默认融合权重
const DEFAULT_WEIGHTS: FusionWeights = {
	semantic: 0.35,
	structured: 0.3,
	temporal: 0.2,
	keyword: 0.15,
};

// 混合检索器
export class HybridRetriever {
	constructor(
		private deps: HybridRetrieverDeps,
		private weights: FusionWeights = DEFAULT_WEIGHTS
	) {}

	/** 检索记忆 */
	async retrieve(query: RetrievalQuery): Promise<MemoryDocument[]> {
		const topK = query.topK ?? 5;

		// 并行 4 通道检索
		const [semantic, structured, temporal, keyword] = await Promise.allSettled([
			this.semanticChannel(query, topK * 2),
			this.structuredChannel(query, topK * 2),
			this.temporalChannel(query, topK),
			this.keywordChannel(query, topK * 2),
		]);

		const results: Map<string, { doc: MemoryDocument; score: number }> = new Map();

		// 合并结果
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

		// 合并结果
		if (semantic.status === "fulfilled") merge(semantic.value, this.weights.semantic);
		if (structured.status === "fulfilled") merge(structured.value, this.weights.structured);
		if (temporal.status === "fulfilled") merge(temporal.value, this.weights.temporal);
		if (keyword.status === "fulfilled") merge(keyword.value, this.weights.keyword);

		return [...results.values()]
			.sort((a, b) => b.score - a.score)
			.slice(0, topK)
			.map(({ doc, score }) => ({ ...doc, score }));
	}

	// 语义向量检索通道
	private async semanticChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
		const vector = await this.deps.embedFn.embed(query.text);
		const res = await this.deps.vectorize.query(vector, {
			topK: k,
			filter: { sessionId: query.sessionId },
		});
		return res.matches.map((m) => ({
			id: m.id,
			type: "event",
			content: String(m.metadata?.content ?? ""),
			metadata: m.metadata ?? {},
			createdAt: Number(m.metadata?.createdAt ?? 0),
			score: m.score,
		}));
	}

	// 结构化 D1 事实/配置检索通道
	private async structuredChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
		const rows = await this.deps.db
			.prepare(
				`SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND type IN ('fact', 'profile')
         ORDER BY created_at DESC
         LIMIT ?`
			)
			.bind(query.sessionId, k)
			.all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

		return rows.results.map((r) => ({
			id: r.id,
			type: r.type as MemoryDocument["type"],
			content: r.content,
			metadata: JSON.parse(r.metadata ?? "{}"),
			createdAt: r.created_at,
			score: 1.0,
		}));
	}

	// 时间范围摘要检索通道
	private async temporalChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
		const rows = await this.deps.db
			.prepare(
				`SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND type = 'summary'
         ORDER BY created_at DESC
         LIMIT ?`
			)
			.bind(query.sessionId, k)
			.all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

		return rows.results.map((r) => ({
			id: r.id,
			type: "summary" as const,
			content: r.content,
			metadata: JSON.parse(r.metadata ?? "{}"),
			createdAt: r.created_at,
			score: 0.8,
		}));
	}

	// 关键词全文检索通道
	private async keywordChannel(query: RetrievalQuery, k: number): Promise<MemoryDocument[]> {
		const terms = query.text.split(/\s+/).filter(Boolean).slice(0, 5);
		if (terms.length === 0) return [];

		const conditions = terms.map(() => "content LIKE ?").join(" OR ");
		const bindings = terms.map((t) => `%${t}%`);

		const rows = await this.deps.db
			.prepare(
				`SELECT id, type, content, metadata, created_at
         FROM memories
         WHERE session_id = ? AND (${conditions})
         ORDER BY created_at DESC
         LIMIT ?`
			)
			.bind(query.sessionId, ...bindings, k)
			.all<{ id: string; type: string; content: string; metadata: string; created_at: number }>();

		return rows.results.map((r) => ({
			id: r.id,
			type: r.type as MemoryDocument["type"],
			content: r.content,
			metadata: JSON.parse(r.metadata ?? "{}"),
			createdAt: r.created_at,
			score: 0.6,
		}));
	}
}
