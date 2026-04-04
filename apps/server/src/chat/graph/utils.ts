import type { RunnableConfig } from "@langchain/core/runnables";
import type { ChatDeps } from "../runtime/create-chat-deps.js";
import { ChatGraphConfig } from "./config.js";

/** 获取 chat 依赖 */
export function getDeps(config?: RunnableConfig<typeof ChatGraphConfig.State>): ChatDeps {
	const deps = config?.configurable?.deps;
	if (!deps) {
		throw new Error("Missing chat graph deps");
	}
	return deps;
}
