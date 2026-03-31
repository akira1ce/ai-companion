import type {
	ChatRequest,
	ChatResponse,
	EmotionContext,
	GetEmotionRequest,
	GetMessagesRequest,
} from "@ai-companion/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export interface HistoryMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
	const res = await fetch(`${API_URL}/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<ChatResponse>;
}

export async function getMessages(req: GetMessagesRequest): Promise<HistoryMessage[]> {
	const res = await fetch(`${API_URL}/messages`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const data = (await res.json()) as { messages: HistoryMessage[] };
	return data.messages;
}

export async function getEmotion(req: GetEmotionRequest): Promise<EmotionContext> {
	const res = await fetch(`${API_URL}/emotion`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<EmotionContext>;
}
