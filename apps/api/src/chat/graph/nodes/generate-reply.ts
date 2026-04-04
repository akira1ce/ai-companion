import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

/** 生成回复 */
export async function generateReplyNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { chatService } = getDeps(config);
	const reply = await chatService.generateReply({
		userId: state.userId,
		sessionId: state.sessionId,
		systemPrompt: state.systemPrompt!,
		historyMessages: state.sessionMessages,
		message: state.message,
	});

	return { reply };
}
