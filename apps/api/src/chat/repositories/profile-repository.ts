import type { Env } from "../../index.js";

export class ProfileRepository {
	constructor(private kv: Env["KV"]) {}

	async get(sessionId: string): Promise<string | null> {
		return this.kv.get(`profile:${sessionId}`);
	}
}
