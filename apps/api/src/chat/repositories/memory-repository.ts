import { HybridRetriever, MemoryWriter } from "@ai-companion/memory";
import type { MemoryDocument } from "@ai-companion/types";

export class MemoryRepository {
	constructor(
		private retriever: HybridRetriever,
		private writer: MemoryWriter
	) {}

	/** 检索记忆 */
	async retrieve(message: string, sessionId: string): Promise<MemoryDocument[]> {
		return this.retriever.retrieve({ text: message, sessionId, topK: 5 });
	}

	/** 写入提取的记忆 */
	async writeExtracted(sessionId: string, docs: MemoryDocument[]): Promise<void> {
		if (docs.length === 0) return;
		await this.writer.writeMemoryAsync(sessionId, docs);
	}
}
