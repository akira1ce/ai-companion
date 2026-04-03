import type { ChatRequest } from "@ai-companion/types";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { createChatGraph } from "../chat/graph/graph.js";
import { createChatDeps } from "../chat/runtime/create-chat-deps.js";

export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<ChatRequest>();
	const { userId, message, sessionId } = body;

	if (!userId || !message || !sessionId) {
		return c.json({ error: "userId, message, sessionId are required" }, 400);
	}

	const graph = createChatGraph();
	const deps = createChatDeps(c.env, c.executionCtx);
	const result = await graph.invoke(
		{
			userId,
			message,
			sessionId,
		},
		{
			configurable: { deps },
		}
	);

	return c.json(result.response);
}
