export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-3">
      <div className="flex gap-1.5 px-4 py-3 bg-bubble-assistant rounded-[18px] rounded-bl-[4px]">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            className="block w-[7px] h-[7px] rounded-full bg-chat-muted"
            style={{
              animation: "imessage-typing 1.4s infinite",
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
