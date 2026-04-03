import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function persistTurnNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService, sessionService } = getDeps(config);

	await Promise.all([
		emotionService.saveEmotion(state.sessionId, state.emotion!),
		sessionService.persistTurn({
			sessionId: state.sessionId,
			userMessage: state.message,
			assistantReply: state.reply!,
			emotion: state.emotion!,
			now: state.now!,
		}),
	]);

	return {};
}
