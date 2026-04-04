import { MemoryWriter } from "@ai-companion/memory";
import type { Env } from "../../index.js";

export class MessageRepository {
	constructor(
		private db: Env["DB"],
		private writer: MemoryWriter
	) {}

	/** 加载 session messages */
	async loadSessionContext(sessionId: string) {
		return this.writer.readSessionContext(sessionId);
	}

	/** 保存 session messages */
	async saveSessionContext(sessionId: string, messages: Array<{ role: string; content: string }>): Promise<void> {
		await this.writer.writeSessionContext(sessionId, { messages });
	}

	/** 追加 messages */
	async appendMessages(params: {
		sessionId: string;
		userMessage: string;
		assistantReply: string;
		now: number;
	}): Promise<void> {
		await this.db.batch([
			this.db
				.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)")
				.bind(params.sessionId, "user", params.userMessage, params.now),
			this.db
				.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)")
				.bind(params.sessionId, "assistant", params.assistantReply, params.now + 1),
		]);
	}
}
