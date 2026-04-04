import type {
	ChatRequest,
	ChatResponse,
	EmotionContext,
	GetEmotionRequest,
	GetMessagesRequest,
	GetSessionsRequest,
	GetSessionsResponse,
} from "@ai-companion/types";
import { post } from "@/lib/fetcher";
import { HistoryMessage } from "./type";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/** 发送消息 */
export async function apiSendMessage(params: ChatRequest) {
	return post<ChatResponse>(`${API_URL}/chat`, params);
}

/** 获取消息列表 */
export async function apiGetMessages(params: GetMessagesRequest) {
	return post<{ messages: HistoryMessage[] }>(`${API_URL}/messages`, params);
}

/** 获取情感状态 */
export async function apiGetEmotion(params: GetEmotionRequest) {
	return post<EmotionContext>(`${API_URL}/emotion`, params);
}

/** 获取会话列表 */
export async function apiGetSessions(params: GetSessionsRequest) {
	return post<GetSessionsResponse>(`${API_URL}/sessions`, params);
}
