import { ChatGraphState } from "../state.js";

/** 构建响应 */
export function buildResponseNode(state: typeof ChatGraphState.State) {
	console.log("akira.buildResponseNode.state.memories", state.memories);
	return {
		response: {
			reply: state.reply!,
			emotion: state.emotion!,
			sessionId: state.sessionId,
		},
	};
}
