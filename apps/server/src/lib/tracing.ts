import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { Client } from "langsmith";
import type { Env } from "../index.js";

export interface TracingContext {
	client: Client;
	tracer: LangChainTracer;
}

/** 创建 tracer */
export function createTracer(env: Env): TracingContext | undefined {
	if (!env.LANGSMITH_API_KEY) return undefined;

	const client = new Client({
		apiKey: env.LANGSMITH_API_KEY,
		apiUrl: "https://api.smith.langchain.com",
	});

	const tracer = new LangChainTracer({
		client,
		projectName: env.LANGSMITH_PROJECT || "ai-companion",
	});

	return { client, tracer };
}
