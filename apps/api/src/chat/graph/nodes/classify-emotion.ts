import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

/** 分类情绪 */
export async function classifyEmotionNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService } = getDeps(config);

	return {
		emotionEvent: await emotionService.classifyEvent(state.message),
	};
}
