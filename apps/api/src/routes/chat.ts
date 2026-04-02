import { applyDecay, EmotionFSM, IntimacySystem } from "@ai-companion/emotion";
import { HybridRetriever, MemoryWriter } from "@ai-companion/memory";
import { assemblePrompt } from "@ai-companion/prompt";
import type { ChatRequest, ChatResponse, EmotionContext, UserProfile } from "@ai-companion/types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { classifyEmotionEvent } from "../lib/emotion-classifier.js";
import { extractMemories } from "../lib/memory-extractor.js";
import { createChatModel, createEmbeddings } from "../lib/model.js";
import { createTracer } from "../lib/tracing.js";

const fsm = new EmotionFSM();
const intimacy = new IntimacySystem();

const DEFAULT_EMOTION: EmotionContext = {
	state: "calm",
	intensity: 0,
	intimacy: 50,
	updatedAt: Date.now(),
};

const DEFAULT_PROFILE: UserProfile = {
	id: "",
	name: "你",
};

async function loadEmotionContext(kv: Env["KV"], sessionId: string): Promise<EmotionContext> {
	const raw = await kv.get(`emotion:${sessionId}`);
	if (!raw) return { ...DEFAULT_EMOTION, updatedAt: Date.now() };
	try {
		return JSON.parse(raw) as EmotionContext;
	} catch {
		return { ...DEFAULT_EMOTION, updatedAt: Date.now() };
	}
}

async function saveEmotionContext(kv: Env["KV"], sessionId: string, ctx: EmotionContext) {
	await kv.put(`emotion:${sessionId}`, JSON.stringify(ctx));
}

async function loadUserProfile(kv: Env["KV"], sessionId: string): Promise<UserProfile> {
	const raw = await kv.get(`profile:${sessionId}`);
	if (!raw) return { ...DEFAULT_PROFILE, id: sessionId };
	try {
		return JSON.parse(raw) as UserProfile;
	} catch {
		return { ...DEFAULT_PROFILE, id: sessionId };
	}
}

export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<ChatRequest>();
	const { userId, message, sessionId } = body;

	if (!userId || !message || !sessionId) {
		return c.json({ error: "userId, message, sessionId are required" }, 400);
	}

	const env = c.env;
	const model = createChatModel(env);
	const embeddings = createEmbeddings(env);
	const tracing = createTracer(env);
	const callbacks = tracing ? [tracing.tracer] : [];

	const embedFn = { embed: (text: string) => embeddings.embedQuery(text) };

	const retriever = new HybridRetriever({
		vectorize: env.VECTORIZE,
		db: env.DB,
		kv: env.KV,
		embedFn,
	});
	const writer = new MemoryWriter({ vectorize: env.VECTORIZE, db: env.DB, kv: env.KV, embedFn });

	// 1. Load + decay emotion
	const rawEmotion = await loadEmotionContext(env.KV, sessionId);
	const emotion = applyDecay(rawEmotion);

	// 2. Load user profile
	const userProfile = await loadUserProfile(env.KV, sessionId);

	// 3. Parallel: classify emotion event + retrieve memories
	const [emotionEvent, memories] = await Promise.all([
		classifyEmotionEvent(model, message, callbacks),
		retriever.retrieve({ text: message, sessionId, topK: 5 }),
	]);

	// 4. Transition FSM
	let updatedEmotion = emotion;
	if (emotionEvent) {
		const { context: nextCtx } = fsm.transition(emotion, emotionEvent);
		const newIntimacy = intimacy.updateFromEmotion(nextCtx.intimacy, nextCtx.state);
		updatedEmotion = { ...nextCtx, intimacy: newIntimacy };
	}

	// 5. Assemble system prompt
	const systemPrompt = assemblePrompt({ emotion: updatedEmotion, memories, userProfile });

	// 6. Load session history from KV
	const session = await writer.readSessionContext(sessionId);
	const historyMessages = session.messages.map((m) =>
		m.role === "user" ? new HumanMessage(m.content) : new SystemMessage(m.content)
	);

	// 7. Call LLM
	const response = await model.invoke(
		[new SystemMessage(systemPrompt), ...historyMessages, new HumanMessage(message)],
		{ callbacks, runName: "chat-completion", metadata: { userId, sessionId } }
	);
	const reply = typeof response.content === "string" ? response.content : String(response.content);

	// 8. Sync writes (session context + emotion state + D1 messages)
	const now = Date.now();
	await Promise.all([
		writer.writeSessionContext(sessionId, {
			messages: [...session.messages, { role: "user", content: message }, { role: "assistant", content: reply }].slice(
				-20
			), // keep last 20 turns
		}),
		saveEmotionContext(env.KV, sessionId, updatedEmotion),
		env.DB.batch([
			env.DB.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)").bind(
				sessionId,
				"user",
				message,
				now
			),
			env.DB.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)").bind(
				sessionId,
				"assistant",
				reply,
				now + 1
			),
		]),
	]);

	// 9. Async memory extraction (non-blocking)
	c.executionCtx.waitUntil(
		(async () => {
			try {
				const docs = await extractMemories(model, sessionId, message, reply, callbacks);
				console.log("[memory-extractor] extracted docs", { sessionId, count: docs.length });

				if (docs.length > 0) {
					await writer.writeMemoryAsync(sessionId, docs);
					console.log("[memory-extractor] memory write completed", { sessionId, count: docs.length });
				}
			} catch (error) {
				console.error("[memory-extractor] async extraction failed", { sessionId, error });
			} finally {
				if (tracing) {
					await tracing.client.awaitPendingTraceBatches();
				}
			}
		})()
	);

	const result: ChatResponse = {
		reply,
		emotion: updatedEmotion,
		sessionId,
	};

	return c.json(result);
}
