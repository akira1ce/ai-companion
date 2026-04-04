import { formatTimeSeparator, formatMessageTime } from "@/lib/format-time";

export function TimeSeparator({ timestamp }: { timestamp: number }) {
  const label = formatTimeSeparator(timestamp);
  const time = formatMessageTime(timestamp);

  return (
    <div className="flex justify-center py-2">
      <span className="text-xs font-medium text-chat-muted">
        {label} {time}
      </span>
    </div>
  );
}
