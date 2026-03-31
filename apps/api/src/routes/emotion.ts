import type { GetEmotionRequest } from "@ai-companion/types";
import type { Context } from "hono";
import type { Env } from "../index.js";

export async function handleGetEmotion(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<GetEmotionRequest>();
	const { sessionId } = body;

	const raw = await c.env.KV.get(`emotion:${sessionId}`);
	if (!raw) return c.json({ state: "calm", intensity: 0, intimacy: 50 });

	return c.json(JSON.parse(raw));
}
