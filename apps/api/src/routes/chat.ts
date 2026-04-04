import type { ChatRequest } from "@ai-companion/types";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { createChatGraph } from "../chat/graph/graph.js";
import { createChatDeps } from "../chat/runtime/create-chat-deps.js";

export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<ChatRequest>();
	const { userId, message, sessionId } = body;

	if (!userId || !message) {
		return c.json({ error: "userId and message are required" }, 400);
	}

	const graph = createChatGraph();
	const deps = createChatDeps(c.env, c.executionCtx);
	const resolvedSessionId = await deps.sessionService.resolveSession({
		userId,
		sessionId,
		now: Date.now(),
	});
	const result = await graph.invoke(
		{
			userId,
			message,
			sessionId: resolvedSessionId,
		},
		{
			configurable: { deps },
		}
	);

	return c.json(result.response);
}
