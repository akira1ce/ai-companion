import { ChatGraphState } from "../state.js";

export function shouldRetrieveMemory(state: typeof ChatGraphState.State) {
	if (!state.shouldRetrieveMemory) return "skip";
	if (state.message.trim().length < 4) return "skip";
	return "retrieve";
}
