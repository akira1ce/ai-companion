import { GetMessagesRequest } from "@ai-companion/types";
import type { Context } from "hono";
import type { Env } from "../index.js";

export async function handleGetMessages(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<GetMessagesRequest>();
	const { sessionId, limit } = body;

	const rows = await c.env.DB.prepare(
		"SELECT id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?"
	)
		.bind(sessionId, limit)
		.all<{ id: string; role: string; content: string; created_at: number }>();

	const messages = (rows.results ?? []).reverse().map((r) => ({
		id: r.id,
		role: r.role,
		content: r.content,
		timestamp: r.created_at,
	}));

	return c.json({ messages });
}
