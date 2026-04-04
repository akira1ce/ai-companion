import { ChatGraphState } from "../state.js";

/** 是否提取记忆 */
export function shouldExtractMemory(state: typeof ChatGraphState.State) {
	if (!state.shouldExtractMemory) return "skip";
	if (!state.reply?.trim()) return "skip";
	if (state.reply.trim().length < 4) return "skip";
	return "extract";
}
