import { applyDecay, EmotionFSM, IntimacySystem } from "@ai-companion/emotion";
import type { EmotionContext, EmotionEvent, UserProfile } from "@ai-companion/types";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Env } from "../../index.js";
import { classifyEmotionEvent } from "../../lib/emotion-classifier.js";

const fsm = new EmotionFSM();
const intimacy = new IntimacySystem();

const DEFAULT_EMOTION: EmotionContext = {
	state: "calm",
	intensity: 0,
	intimacy: 50,
	updatedAt: Date.now(),
};

const DEFAULT_PROFILE: UserProfile = {
	id: "",
	name: "你",
};

export class EmotionService {
	constructor(
		private kv: Env["KV"],
		private model: BaseChatModel,
		private callbacks: BaseCallbackHandler[] = []
	) {}

	async loadEmotion(sessionId: string): Promise<EmotionContext> {
		const raw = await this.kv.get(`emotion:${sessionId}`);
		if (!raw) return { ...DEFAULT_EMOTION, updatedAt: Date.now() };

		try {
			return applyDecay(JSON.parse(raw) as EmotionContext);
		} catch {
			return { ...DEFAULT_EMOTION, updatedAt: Date.now() };
		}
	}

	async loadUserProfile(sessionId: string): Promise<UserProfile> {
		const raw = await this.kv.get(`profile:${sessionId}`);
		if (!raw) return { ...DEFAULT_PROFILE, id: sessionId };

		try {
			return JSON.parse(raw) as UserProfile;
		} catch {
			return { ...DEFAULT_PROFILE, id: sessionId };
		}
	}

	async classifyEvent(message: string): Promise<EmotionEvent | null> {
		return classifyEmotionEvent(this.model, message, this.callbacks);
	}

	transition(emotion: EmotionContext, event: EmotionEvent | null): EmotionContext {
		if (!event) return emotion;

		const { context: nextContext } = fsm.transition(emotion, event);
		const nextIntimacy = intimacy.updateFromEmotion(nextContext.intimacy, nextContext.state);
		return { ...nextContext, intimacy: nextIntimacy };
	}

	async saveEmotion(sessionId: string, emotion: EmotionContext): Promise<void> {
		await this.kv.put(`emotion:${sessionId}`, JSON.stringify(emotion));
	}
}
