import type { EmotionContext } from "@ai-companion/types";
import { MessageRepository } from "../repositories/message-repository.js";

export class SessionService {
	constructor(private messageRepository: MessageRepository) {}

	async loadSessionMessages(sessionId: string): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
		const session = await this.messageRepository.loadSessionContext(sessionId);
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
		const session = await this.messageRepository.loadSessionContext(params.sessionId);

		await Promise.all([
			this.messageRepository.saveSessionContext(params.sessionId, [
				...session.messages,
				{ role: "user", content: params.userMessage },
				{ role: "assistant", content: params.assistantReply },
			].slice(-20)),
			this.messageRepository.appendMessages({
				sessionId: params.sessionId,
				userMessage: params.userMessage,
				assistantReply: params.assistantReply,
				now: params.now,
			}),
		]);
	}
}
