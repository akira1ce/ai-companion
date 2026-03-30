export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-300 to-purple-400 text-white text-sm font-semibold flex items-center justify-center shrink-0">
          薇
        </div>
      )}
      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word ${
            isUser
              ? "bg-indigo-500 text-white rounded-br-sm"
              : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
          }`}>
          {message.content}
        </div>
        <span className="text-xs text-gray-400 px-1">{time}</span>
      </div>
    </div>
  );
}
