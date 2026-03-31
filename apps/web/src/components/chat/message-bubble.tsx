import type { BubblePosition, ChatMessage } from "@/lib/format-time";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
	message: ChatMessage;
	position: BubblePosition;
}

const userRadiusMap: Record<BubblePosition, string> = {
	single: "rounded-[18px] rounded-br-[4px]",
	first: "rounded-[18px]",
	middle: "rounded-[18px]",
	last: "rounded-[18px] rounded-br-[4px]",
};

const assistantRadiusMap: Record<BubblePosition, string> = {
	single: "rounded-[18px] rounded-bl-[4px]",
	first: "rounded-[18px]",
	middle: "rounded-[18px]",
	last: "rounded-[18px] rounded-bl-[4px]",
};

export function MessageBubble({ message, position }: MessageBubbleProps) {
	const isUser = message.role === "user";

	return (
		<div
			className={cn(
				"max-w-[70%] px-3 py-[6px] text-[17px] leading-[22px] wrap-break-word whitespace-pre-wrap",
				isUser
					? cn("bg-bubble-user text-bubble-user-text self-end", userRadiusMap[position])
					: cn("bg-bubble-assistant text-bubble-assistant-text self-start", assistantRadiusMap[position])
			)}
		>
			{message.content}
		</div>
	);
}
