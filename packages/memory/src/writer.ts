import type { MemoryDocument } from "@ai-companion/types";
import type { D1Binding, EmbeddingFn, KVBinding, VectorizeBinding } from "./retriever.js";

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

	/** kv 存储 session context */
	async writeSessionContext(sessionId: string, ctx: SessionContext): Promise<void> {
		const key = `ctx:${sessionId}`;
		await this.deps.kv.put(key, JSON.stringify(ctx), { expirationTtl: 60 * 60 * 24 });
	}

	/** kv 读取 session context */
	async readSessionContext(sessionId: string): Promise<SessionContext> {
		const key = `ctx:${sessionId}`;
		const raw = await this.deps.kv.get(key);
		return raw ? (JSON.parse(raw) as SessionContext) : { messages: [] };
	}

	/** D1 批量写入 memory */
	async writeMemoryAsync(sessionId: string, docs: MemoryDocument[]): Promise<void> {
		await Promise.all(docs.map((doc) => this.writeOne(sessionId, doc)));
	}

	/** D1 单条写入 memory */
	private async writeOne(sessionId: string, doc: MemoryDocument): Promise<void> {
		const metaStr = JSON.stringify(doc.metadata);
		await this.deps.db
			.prepare(
				`INSERT OR REPLACE INTO memories (id, session_id, type, content, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(doc.id, sessionId, doc.type, doc.content, metaStr, doc.createdAt)
			.all();

		if (doc.type === "event" || doc.type === "keyword") {
			const vector = await this.deps.embedFn.embed(doc.content);
			await this.upsertVector(doc.id, vector, {
				sessionId,
				content: doc.content,
				createdAt: String(doc.createdAt),
				type: doc.type,
			});
		}
	}

	/** Vectorize 单条写入向量 */
	private async upsertVector(id: string, vector: number[], metadata: Record<string, string>): Promise<void> {
		// @ts-expect-error — VectorizeIndex.upsert is not in the minimal interface
		await (this.deps.vectorize as { upsert: Function }).upsert([{ id, values: vector, metadata }]);
	}
}
