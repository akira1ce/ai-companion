import type { ListSessionsRequest, ListSessionsResponse } from "@ai-companion/types";
import type { Context } from "hono";
import type { Env } from "../index.js";
import { createChatDeps } from "../chat/runtime/create-chat-deps.js";

export async function handleListSessions(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<ListSessionsRequest>();
	const { userId } = body;

	if (!userId) {
		return c.json({ error: "userId is required" }, 400);
	}

	const deps = createChatDeps(c.env, c.executionCtx);
	const sessions = await deps.sessionService.listSessions(userId);
	return c.json({ sessions } satisfies ListSessionsResponse);
}
