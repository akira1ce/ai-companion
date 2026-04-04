import { ChatGraphState } from "../state.js";

/** 构建响应 */
export function buildResponseNode(state: typeof ChatGraphState.State) {
	return {
		response: {
			reply: state.reply!,
			emotion: state.emotion!,
			sessionId: state.sessionId,
		},
	};
}
