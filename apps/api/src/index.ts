import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleChat } from "./routes/chat.js";
import { handleGetEmotion } from "./routes/emotion.js";
import { handleGetMessages } from "./routes/messages.js";

export type Env = {
	KV: KVNamespace;
	DB: D1Database;
	VECTORIZE: VectorizeIndex;
	DEEPSEEK_API_KEY: string;
	DEEPSEEK_BASE_URL: string;
	DEEPSEEK_MODEL: string;
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

export default app;
