import type { MemoryDocument } from "@ai-companion/types";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type { TracingContext } from "../../lib/tracing.js";
import { extractMemories } from "../../lib/memory-extractor.js";
import { MemoryRepository } from "../repositories/memory-repository.js";

export class MemoryService {
	constructor(
		private params: {
			memoryRepository: MemoryRepository;
			model: BaseChatModel;
			callbacks?: BaseCallbackHandler[];
			tracing?: TracingContext;
		}
	) {}

	async retrieve(message: string, sessionId: string): Promise<MemoryDocument[]> {
		return this.params.memoryRepository.retrieve(message, sessionId);
	}

	async extract(sessionId: string, userMessage: string, assistantReply: string): Promise<MemoryDocument[]> {
		return extractMemories(this.params.model, sessionId, userMessage, assistantReply, this.params.callbacks ?? []);
	}

	async writeExtracted(sessionId: string, docs: MemoryDocument[]): Promise<void> {
		await this.params.memoryRepository.writeExtracted(sessionId, docs);
	}

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
						console.log("[memory-extractor] memory write completed", { sessionId: params.sessionId, count: docs.length });
					}
				} catch (error) {
					console.error("[memory-extractor] async extraction failed", { sessionId: params.sessionId, error });
				} finally {
					if (this.params.tracing) {
						await this.params.tracing.client.awaitPendingTraceBatches();
					}
				}
			})()
		);
	}
}
