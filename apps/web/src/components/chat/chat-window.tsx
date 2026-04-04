"use client";

import type { EmotionContext } from "@ai-companion/types";
import { useCallback, useEffect, useState } from "react";
import { apiGetEmotion, apiGetMessages, apiSendMessage } from "@/services/indexx";
import type { HistoryMessage } from "@/services/type";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";

const USER_ID = "akira1ce";
const SESSION_ID = "akira1ce-session-current";

export function ChatWindow() {
	const [messages, setMessages] = useState<HistoryMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [emotion, setEmotion] = useState<EmotionContext>({
		state: "calm",
		intensity: 0,
		intimacy: 50,
		updatedAt: Date.now(),
	});

	useEffect(() => {
		Promise.all([apiGetMessages({ sessionId: SESSION_ID, limit: 50 }), apiGetEmotion({ sessionId: SESSION_ID })])
			.then(([history, emo]) => {
				if (history.length > 0) {
					setMessages(history.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })));
				}
				setEmotion(emo);
			})
			.catch(() => {});
	}, []);

	const submit = useCallback(async () => {
		const text = input.trim();
		if (!text || loading) return;

		setMessages((prev) => [...prev, { role: "user", content: text, timestamp: Date.now() }]);
		setInput("");
		setLoading(true);

		try {
			const res = await apiSendMessage({ userId: USER_ID, sessionId: SESSION_ID, message: text });
			setMessages((prev) => [...prev, { role: "assistant", content: res.reply, timestamp: Date.now() }]);
			setEmotion(res.emotion);
		} catch {
			setMessages((prev) => [...prev, { role: "assistant", content: "网络好像出了点问题……", timestamp: Date.now() }]);
		} finally {
			setLoading(false);
		}
	}, [input, loading]);

	return (
		<div className="bg-chat-bg relative mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden">
			<ChatHeader emotion={emotion} />
			<MessageList messages={messages} loading={loading} />
			<ChatInput value={input} onChange={setInput} onSubmit={submit} disabled={loading} />
		</div>
	);
}
