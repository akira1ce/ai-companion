import type { ChatResponse, EmotionContext, EmotionEvent, MemoryDocument, UserProfile } from "@ai-companion/types";
import { Annotation } from "@langchain/langgraph";

/** 聊天图状态 */
export const ChatGraphState = Annotation.Root({
	userId: Annotation<string>,
	sessionId: Annotation<string>,
	message: Annotation<string>,

	/** 情绪 */
	emotion: Annotation<EmotionContext | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 用户配置 */
	userProfile: Annotation<UserProfile | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 情绪事件 */
	emotionEvent: Annotation<EmotionEvent | null>({
		value: (_current, update) => update,
		default: () => null,
	}),

	/** 记忆 */
	memories: Annotation<MemoryDocument[]>({
		value: (_current, update) => update,
		default: () => [],
	}),

	/** session messages */
	sessionMessages: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
		value: (_current, update) => update,
		default: () => [],
	}),

	/** 系统提示词 */
	systemPrompt: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 回复 */
	reply: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 当前时间 */
	now: Annotation<number | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 是否检索记忆 */
	shouldRetrieveMemory: Annotation<boolean>({
		value: (_current, update) => update,
		default: () => true,
	}),

	/** 是否提取记忆 */
	shouldExtractMemory: Annotation<boolean>({
		value: (_current, update) => update,
		default: () => true,
	}),

	/** 响应 */
	response: Annotation<ChatResponse | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),

	/** 错误 */
	error: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
});
