import type { Env } from "../../index.js";

export class SessionRepository {
	constructor(private db: Env["DB"]) {}

	async ensureSession(params: { sessionId: string; userId: string; now: number }): Promise<void> {
		await this.db.batch([
			this.db
				.prepare("INSERT OR IGNORE INTO sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
				.bind(params.sessionId, params.userId, "", params.now, params.now),
			this.db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").bind(params.now, params.sessionId),
		]);
	}
}
