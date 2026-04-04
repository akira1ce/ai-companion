import { assemblePrompt } from "@ai-companion/prompt";
import type { EmotionContext, MemoryDocument, UserProfile } from "@ai-companion/types";

export class PromptService {
	/** 组装系统提示词 */
	buildPrompt(input: { emotion: EmotionContext; memories: MemoryDocument[]; userProfile: UserProfile }): string {
		return assemblePrompt(input);
	}
}
