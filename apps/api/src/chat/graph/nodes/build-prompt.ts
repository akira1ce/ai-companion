import { ChatGraphState } from "../state.js";
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { getDeps } from "../utils.js";

export async function buildPromptNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { promptService } = getDeps(config);

	return {
		systemPrompt: promptService.buildPrompt({
			emotion: state.emotion!,
			memories: state.memories,
			userProfile: state.userProfile!,
		}),
	};
}
