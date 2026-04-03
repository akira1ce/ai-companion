import type { ChatResponse, EmotionContext, EmotionEvent, MemoryDocument, UserProfile } from "@ai-companion/types";
import { Annotation } from "@langchain/langgraph";

export const ChatGraphState = Annotation.Root({
	userId: Annotation<string>,
	sessionId: Annotation<string>,
	message: Annotation<string>,
	emotion: Annotation<EmotionContext | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	userProfile: Annotation<UserProfile | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	emotionEvent: Annotation<EmotionEvent | null>({
		value: (_current, update) => update,
		default: () => null,
	}),
	memories: Annotation<MemoryDocument[]>({
		value: (_current, update) => update,
		default: () => [],
	}),
	sessionMessages: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
		value: (_current, update) => update,
		default: () => [],
	}),
	systemPrompt: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	reply: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	now: Annotation<number | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	shouldRetrieveMemory: Annotation<boolean>({
		value: (_current, update) => update,
		default: () => true,
	}),
	shouldExtractMemory: Annotation<boolean>({
		value: (_current, update) => update,
		default: () => true,
	}),
	response: Annotation<ChatResponse | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
	error: Annotation<string | undefined>({
		value: (_current, update) => update,
		default: () => undefined,
	}),
});
