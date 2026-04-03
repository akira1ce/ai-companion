import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function scheduleMemoryExtractionNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { memoryService, executionCtx } = getDeps(config);

	memoryService.scheduleExtraction({
		executionCtx,
		sessionId: state.sessionId,
		userMessage: state.message,
		assistantReply: state.reply!,
	});

	return {};
}
