import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function loadSessionNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { sessionService } = getDeps(config);

	return {
		sessionMessages: await sessionService.loadSessionMessages(state.sessionId),
	};
}
