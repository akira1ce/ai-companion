import type { GetSessionsRequest, GetSessionsResponse } from "@ai-companion/types";
import type { Context } from "hono";
import { createChatDeps } from "../chat/runtime/create-chat-deps.js";
import type { Env } from "../index.js";

export async function handleGetSessions(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<GetSessionsRequest>();
	const { userId } = body;

	if (!userId) {
		return c.json({ error: "userId is required" }, 400);
	}

	const deps = createChatDeps(c.env, c.executionCtx);
	const sessions = await deps.sessionService.listSessions(userId);
	return c.json({ sessions } satisfies GetSessionsResponse);
}
