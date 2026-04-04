import type { MemoryDocument } from "@ai-companion/types";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { extractMemories } from "../../lib/memory-extractor.js";
import type { TracingContext } from "../../lib/tracing.js";
import { MemoryRepository } from "../repositories/memory-repository.js";

export class MemoryService {
	constructor(
		private memoryRepository: MemoryRepository,
		private model: BaseChatModel,
		private callbacks?: BaseCallbackHandler[],
		private tracing?: TracingContext
	) {}

	/** 检索记忆 */
	async retrieve(message: string, sessionId: string): Promise<MemoryDocument[]> {
		return this.memoryRepository.retrieve(message, sessionId);
	}

	/** 提取记忆 */
	async extract(sessionId: string, userMessage: string, assistantReply: string): Promise<MemoryDocument[]> {
		return extractMemories(this.model, sessionId, userMessage, assistantReply, this.callbacks ?? []);
	}

	/** 写入提取的记忆 */
	async writeExtracted(sessionId: string, docs: MemoryDocument[]): Promise<void> {
		await this.memoryRepository.writeExtracted(sessionId, docs);
	}

	/** 调度记忆提取 */
	scheduleExtraction(params: {
		executionCtx: ExecutionContext;
		sessionId: string;
		userMessage: string;
		assistantReply: string;
	}): void {
		params.executionCtx.waitUntil(
			(async () => {
				try {
					const docs = await this.extract(params.sessionId, params.userMessage, params.assistantReply);
					console.log("[memory-extractor] extracted docs", { sessionId: params.sessionId, count: docs.length });

					if (docs.length > 0) {
						await this.writeExtracted(params.sessionId, docs);
						console.log("[memory-extractor] memory write completed", {
							sessionId: params.sessionId,
							count: docs.length,
						});
					}
				} catch (error) {
					console.error("[memory-extractor] async extraction failed", { sessionId: params.sessionId, error });
				} finally {
					if (this.tracing) {
						await this.tracing.client.awaitPendingTraceBatches();
					}
				}
			})()
		);
	}
}
