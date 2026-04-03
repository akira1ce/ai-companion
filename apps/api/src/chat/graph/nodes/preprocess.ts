import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function preprocessNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService, memoryService } = getDeps(config);
	const [emotionEvent, memories] = await Promise.all([
		emotionService.classifyEvent(state.message),
		memoryService.retrieve(state.message, state.sessionId),
	]);

	return {
		emotionEvent,
		memories,
	};
}
