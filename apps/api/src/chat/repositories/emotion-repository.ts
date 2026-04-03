import type { EmotionContext } from "@ai-companion/types";
import type { Env } from "../../index.js";

export class EmotionRepository {
	constructor(private kv: Env["KV"]) {}

	async get(sessionId: string): Promise<string | null> {
		return this.kv.get(`emotion:${sessionId}`);
	}

	async save(sessionId: string, emotion: EmotionContext): Promise<void> {
		await this.kv.put(`emotion:${sessionId}`, JSON.stringify(emotion));
	}
}
