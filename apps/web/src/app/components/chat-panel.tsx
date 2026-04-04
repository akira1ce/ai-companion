"use client";

import type { EmotionContext } from "@ai-companion/types";
import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { MessageList } from "@/components/message-list";
import { TEMP_SESSION_ID, USER_ID } from "@/constants";
import { cn } from "@/lib/utils";
import { apiGetEmotion, apiGetMessages, apiSendMessage } from "@/services";
import type { HistoryMessage } from "@/services/type";
import { conversationActions, useConversation } from "@/stores/conversation";

export interface ChatPanelProps {
	className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
	const { current } = useConversation();

	const [messages, setMessages] = useState<HistoryMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [emotion, setEmotion] = useState<EmotionContext>({
		state: "calm",
		intensity: 0,
		intimacy: 50,
		updatedAt: Date.now(),
	});

	const isNewSession = !current;
	const isTempSession = current === TEMP_SESSION_ID;

	/** 加载消息 */
	const loadMessages = async (sessionId: string) => {
		const res = await apiGetMessages({ sessionId, limit: 50 });
		setMessages(res.messages);
	};

	/** 加载情绪 */
	const loadEmotion = async (sessionId: string) => {
		const res = await apiGetEmotion({ sessionId });
		setEmotion(res);
	};

	const reset = () => {
		setLoading(false);
		setMessages([]);
		setEmotion({
			state: "calm",
			intensity: 0,
			intimacy: 50,
			updatedAt: Date.now(),
		});
	};

	useEffect(() => {
		if (isNewSession) return reset();
		if (isTempSession) return;
		setLoading(false);
		loadMessages(current);
		loadEmotion(current);
	}, [current]);

	const submit = async () => {
		const text = input.trim();
		if (!text || loading) return;

		setMessages((prev) => [...prev, { role: "user", content: text, timestamp: Date.now() }]);
		setInput("");
		setLoading(true);

		try {
			if (isNewSession) conversationActions.setCurrent(TEMP_SESSION_ID);
			const res = await apiSendMessage({ userId: USER_ID, sessionId: current, message: text });
			setMessages((prev) => [...prev, { role: "assistant", content: res.reply, timestamp: Date.now() }]);
			setEmotion(res.emotion);
			conversationActions.setCurrent(res.sessionId);
			conversationActions.loadSessions(USER_ID);
		} catch (err) {
			console.error(err);
			setMessages((prev) => [...prev, { role: "assistant", content: "网络好像出了点问题……", timestamp: Date.now() }]);
		} finally {
			setLoading(false);
		}
	};

	if (isNewSession)
		return (
			<div className={cn("bg-chat-bg relative -mt-32 flex items-center justify-center overflow-hidden", className)}>
				<div className="w-2/3 space-y-4 text-center">
					<div className="text-2xl">开始一段新的对话吧...</div>
					<ChatInput value={input} onChange={setInput} onSubmit={submit} disabled={loading} showSendButton={false} />
				</div>
			</div>
		);

	return (
		<div className={cn("bg-chat-bg relative flex flex-col overflow-hidden", className)}>
			<ChatHeader emotion={emotion} />
			<MessageList messages={messages} loading={loading} />
			<ChatInput value={input} onChange={setInput} onSubmit={submit} disabled={loading} />
		</div>
	);
}
