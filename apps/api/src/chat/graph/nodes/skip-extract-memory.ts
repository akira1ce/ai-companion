import { ChatGraphState } from "../state.js";

/** 跳过提取记忆 */
export async function skipExtractMemoryNode(_state: typeof ChatGraphState.State) {
	return {};
}
