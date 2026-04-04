import { HybridRetriever, MemoryWriter } from "@ai-companion/memory";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Env } from "../../index.js";
import { createChatModel, createEmbeddings } from "../../lib/model.js";
import { createTracer } from "../../lib/tracing.js";
import { EmotionRepository } from "../repositories/emotion-repository.js";
import { MemoryRepository } from "../repositories/memory-repository.js";
import { MessageRepository } from "../repositories/message-repository.js";
import { ProfileRepository } from "../repositories/profile-repository.js";
import { SessionRepository } from "../repositories/session-repository.js";
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

/** 创建 chat 依赖 */
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

	const emotionRepository = new EmotionRepository(env.KV);
	const profileRepository = new ProfileRepository(env.KV);
	const memoryRepository = new MemoryRepository(retriever, writer);
	const messageRepository = new MessageRepository(env.DB, writer);
	const sessionRepository = new SessionRepository(env.DB);

	const emotionService = new EmotionService(emotionRepository, profileRepository, model, callbacks);
	const memoryService = new MemoryService(memoryRepository, model, callbacks, tracing);
	const promptService = new PromptService();
	const sessionService = new SessionService(messageRepository, sessionRepository);
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
