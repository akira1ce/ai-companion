import { ChatOpenAI } from "@langchain/openai";
import type { Env } from "../index.js";
import { createCloudflareEmbeddings } from "./embeddings.js";

/** 创建 chat model */
export function createChatModel(env: Env) {
	return new ChatOpenAI({
		model: env.DEEPSEEK_MODEL,
		apiKey: env.DEEPSEEK_API_KEY,
		configuration: { baseURL: env.DEEPSEEK_BASE_URL },
	});
}

// /** 创建 embeddings */
// export function createEmbeddings(env: Env) {
// 	return new OpenAIEmbeddings({
// 		model: "text-embedding-3-small",
// 		apiKey: env.DEEPSEEK_API_KEY,
// 		configuration: { baseURL: env.DEEPSEEK_BASE_URL },
// 	});
// }

/** 创建 embeddings */
export function createEmbeddings(env: Env) {
	return createCloudflareEmbeddings(env);
}
