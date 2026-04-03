import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

export class ChatService {
	constructor(
		private model: BaseChatModel,
		private callbacks: BaseCallbackHandler[] = []
	) {}

	async generateReply(input: {
		userId: string;
		sessionId: string;
		systemPrompt: string;
		historyMessages: Array<{ role: "user" | "assistant"; content: string }>;
		message: string;
	}): Promise<string> {
		const response = await this.model.invoke(
			[
				new SystemMessage(input.systemPrompt),
				...input.historyMessages.map((message) =>
					message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content)
				),
				new HumanMessage(input.message),
			],
			{
				callbacks: this.callbacks,
				runName: "chat-completion",
				metadata: { userId: input.userId, sessionId: input.sessionId },
			}
		);

		return typeof response.content === "string" ? response.content : String(response.content);
	}
}
