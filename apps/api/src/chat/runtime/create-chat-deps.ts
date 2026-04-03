import { HybridRetriever, MemoryWriter } from "@ai-companion/memory";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type { Env } from "../../index.js";
import { createChatModel, createEmbeddings } from "../../lib/model.js";
import { createTracer } from "../../lib/tracing.js";
import { ChatService } from "../services/chat-service.js";
import { EmotionService } from "../services/emotion-service.js";
import { MemoryService } from "../services/memory-service.js";
import { PromptService } from "../services/prompt-service.js";
import { SessionService } from "../services/session-service.js";

export interface ChatDeps {
	emotionService: EmotionService;
	memoryService: MemoryService;
	promptService: PromptService;
	sessionService: SessionService;
	chatService: ChatService;
	executionCtx: ExecutionContext;
}

export function createChatDeps(env: Env, executionCtx: ExecutionContext): ChatDeps {
	const model = createChatModel(env);
	const embeddings = createEmbeddings(env);
	const tracing = createTracer(env);
	const callbacks: BaseCallbackHandler[] = tracing ? [tracing.tracer] : [];
	const embedFn = { embed: (text: string) => embeddings.embedQuery(text) };

	const retriever = new HybridRetriever({
		vectorize: env.VECTORIZE,
		db: env.DB,
		kv: env.KV,
		embedFn,
	});

	const writer = new MemoryWriter({
		vectorize: env.VECTORIZE,
		db: env.DB,
		kv: env.KV,
		embedFn,
	});

	const emotionService = new EmotionService(env.KV, model, callbacks);
	const memoryService = new MemoryService({
		retriever,
		writer,
		model,
		callbacks,
		tracing,
	});
	const promptService = new PromptService();
	const sessionService = new SessionService(env.DB, writer);
	const chatService = new ChatService(model, callbacks);

	return {
		emotionService,
		memoryService,
		promptService,
		sessionService,
		chatService,
		executionCtx,
	};
}
