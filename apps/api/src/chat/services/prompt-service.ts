import { assemblePrompt } from "@ai-companion/prompt";
import type { EmotionContext, MemoryDocument, UserProfile } from "@ai-companion/types";

export class PromptService {
	buildPrompt(input: { emotion: EmotionContext; memories: MemoryDocument[]; userProfile: UserProfile }): string {
		return assemblePrompt(input);
	}
}
