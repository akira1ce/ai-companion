import type {
	ChatRequest,
	ChatResponse,
	EmotionContext,
	GetEmotionRequest,
	GetMessagesRequest,
} from "@ai-companion/types";
import { HistoryMessage } from "./type";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export async function apiSendMessage(req: ChatRequest): Promise<ChatResponse> {
	const res = await fetch(`${API_URL}/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<ChatResponse>;
}

export async function apiGetMessages(req: GetMessagesRequest): Promise<HistoryMessage[]> {
	const res = await fetch(`${API_URL}/messages`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const data = (await res.json()) as { messages: HistoryMessage[] };
	return data.messages;
}

export async function apiGetEmotion(req: GetEmotionRequest): Promise<EmotionContext> {
	const res = await fetch(`${API_URL}/emotion`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	return res.json() as Promise<EmotionContext>;
}
