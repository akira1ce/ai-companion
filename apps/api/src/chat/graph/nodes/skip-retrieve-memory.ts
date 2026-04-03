import { ChatGraphState } from "../state.js";

export async function skipRetrieveMemoryNode(_state: typeof ChatGraphState.State) {
	return {
		memories: [],
	};
}
