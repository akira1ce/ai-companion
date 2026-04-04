import type { Session } from "@ai-companion/types";
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

	async listSessions(userId: string): Promise<Session[]> {
		const rows = await this.db
			.prepare("SELECT id, title, created_at, updated_at FROM sessions WHERE user_id = ? ORDER BY updated_at DESC")
			.bind(userId)
			.all<{ id: string; title: string; created_at: number; updated_at: number }>();

		return (rows.results ?? []).map((row) => ({
			id: row.id,
			title: row.title,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}
}
