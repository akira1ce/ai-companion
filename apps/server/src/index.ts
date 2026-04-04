import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleChat } from "./routes/chat.js";
import { handleGetEmotion } from "./routes/emotion.js";
import { handleGetMessages } from "./routes/messages.js";
import { handleGetSessions } from "./routes/sessions.js";

export type Env = {
	AI: Ai;
	KV: KVNamespace;
	DB: D1Database;
	VECTORIZE: VectorizeIndex;
	DEEPSEEK_API_KEY: string;
	DEEPSEEK_BASE_URL: string;
	DEEPSEEK_MODEL: string;
	EMBEDDING_API_KEY: string;
	EMBEDDING_BASE_URL: string;
	LANGSMITH_API_KEY: string;
	LANGSMITH_PROJECT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({ origin: "*" }));

app.get("/", (c) => c.json({ status: "ok", service: "ai-companion-api" }));

app.post("/chat", handleChat);

app.post("/messages", handleGetMessages);

app.post("/emotion", handleGetEmotion);
app.post("/sessions", handleGetSessions);

export type AppType = typeof app;
export default app;
