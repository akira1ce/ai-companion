import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

/** 更新情绪 */
export async function updateEmotionNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService } = getDeps(config);

	return {
		emotion: emotionService.transition(state.emotion!, state.emotionEvent),
	};
}
