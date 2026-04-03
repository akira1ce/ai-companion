import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function loadContextNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService } = getDeps(config);
	const [emotion, userProfile] = await Promise.all([
		emotionService.loadEmotion(state.sessionId),
		emotionService.loadUserProfile(state.sessionId),
	]);

	return {
		emotion,
		userProfile,
		now: Date.now(),
	};
}
