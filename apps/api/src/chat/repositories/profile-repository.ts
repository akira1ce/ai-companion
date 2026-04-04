import type { Env } from "../../index.js";

export class ProfileRepository {
	constructor(private kv: Env["KV"]) {}

	/** 加载用户配置 */
	async get(sessionId: string): Promise<string | null> {
		return this.kv.get(`profile:${sessionId}`);
	}
}
