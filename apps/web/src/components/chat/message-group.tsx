import type { MessageGroup as MessageGroupType, BubblePosition } from "@/lib/format-time";
import { MessageBubble } from "./message-bubble";

function getPosition(index: number, total: number): BubblePosition {
  if (total === 1) return "single";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

export function MessageGroup({ group }: { group: MessageGroupType }) {
  const isUser = group.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-[2px]`}>
      {group.messages.map((msg, i) => (
        <MessageBubble
          key={msg.timestamp + i}
          message={msg}
          position={getPosition(i, group.messages.length)}
        />
      ))}
    </div>
  );
}
