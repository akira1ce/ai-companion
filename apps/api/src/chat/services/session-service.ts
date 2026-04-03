import { MemoryWriter } from "@ai-companion/memory";
import type { EmotionContext } from "@ai-companion/types";
import type { Env } from "../../index.js";

export class SessionService {
	constructor(
		private db: Env["DB"],
		private writer: MemoryWriter
	) {}

	async loadSessionMessages(sessionId: string): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
		const session = await this.writer.readSessionContext(sessionId);
		return session.messages
			.filter((message): message is { role: "user" | "assistant"; content: string } =>
				message.role === "user" || message.role === "assistant"
			)
			.map((message) => ({ role: message.role, content: message.content }));
	}

	async persistTurn(params: {
		sessionId: string;
		userMessage: string;
		assistantReply: string;
		emotion: EmotionContext;
		now: number;
	}): Promise<void> {
		await Promise.all([
			this.writer.writeSessionContext(params.sessionId, {
				messages: [
					...(await this.writer.readSessionContext(params.sessionId)).messages,
					{ role: "user", content: params.userMessage },
					{ role: "assistant", content: params.assistantReply },
				].slice(-20),
			}),
			this.db.batch([
				this.db.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)").bind(
					params.sessionId,
					"user",
					params.userMessage,
					params.now
				),
				this.db.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)").bind(
					params.sessionId,
					"assistant",
					params.assistantReply,
					params.now + 1
				),
			]),
		]);
	}
}
