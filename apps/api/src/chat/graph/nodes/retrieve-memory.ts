import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function retrieveMemoryNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { memoryService } = getDeps(config);

	return {
		memories: await memoryService.retrieve(state.message, state.sessionId),
	};
}
