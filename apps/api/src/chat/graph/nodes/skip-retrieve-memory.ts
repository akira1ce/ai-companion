import { ChatGraphState } from "../state.js";

/** 跳过检索记忆 */
export async function skipRetrieveMemoryNode(_state: typeof ChatGraphState.State) {
	return {
		memories: [],
	};
}
