"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EmotionContext } from "@ai-companion/types";
import type { EmotionState } from "@ai-companion/types";
import { sendMessage } from "../lib/api";
import { MessageBubble } from "./message-bubble";
import type { Message } from "./message-bubble";
import { EmotionBadge } from "./emotion-badge";

const USER_ID = "user-demo";
const SESSION_ID = `session-${Date.now()}`;

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "嗨～我在呢，今天怎么样？(＾▽＾)",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState<EmotionContext>({
    state: "calm",
    intensity: 0,
    intimacy: 50,
    updatedAt: Date.now(),
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        { role: "assistant", content: "（网络好像出了点问题……）", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col h-dvh max-w-2xl mx-auto bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-pink-300 to-purple-400 text-white text-base font-bold flex items-center justify-center">
            薇
          </div>
          <div>
            <h1 className="text-base font-semibold">小薇</h1>
            <p className="text-xs text-gray-400">你的 AI 伴侣</p>
          </div>
        </div>
        <EmotionBadge state={emotion.state as EmotionState} intensity={emotion.intensity} />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-300 to-purple-400 shrink-0" />
            <div className="flex gap-1.5 px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-purple-300 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="flex items-end gap-2.5 px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="说点什么……"
          rows={1}
          disabled={loading}
          className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[15px] resize-none outline-none focus:border-violet-400 transition-colors max-h-28 overflow-y-auto disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shrink-0">
          发送
        </button>
      </footer>
    </div>
  );
}
