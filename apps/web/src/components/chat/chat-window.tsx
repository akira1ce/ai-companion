"use client";

import { useState, useCallback, useEffect } from "react";
import type { EmotionContext } from "@ai-companion/types";
import { sendMessage, getMessages, getEmotion } from "@/lib/api";
import type { ChatMessage } from "@/lib/format-time";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

const USER_ID = "akira1ce";
const SESSION_ID = "default";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState<EmotionContext>({
    state: "calm",
    intensity: 0,
    intimacy: 50,
    updatedAt: Date.now(),
  });

  useEffect(() => {
    Promise.all([getMessages(USER_ID), getEmotion(USER_ID)])
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
      const res = await sendMessage({ userId: USER_ID, sessionId: SESSION_ID, message: text });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, timestamp: Date.now() },
      ]);
      setEmotion(res.emotion);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络好像出了点问题……", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto bg-chat-bg">
      <ChatHeader emotion={emotion} />
      <MessageList messages={messages} loading={loading} />
      <ChatInput value={input} onChange={setInput} onSubmit={submit} disabled={loading} />
    </div>
  );
}
