"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/lib/format-time";
import { groupMessages, shouldShowTimeSeparator } from "@/lib/format-time";
import { MessageGroup } from "./message-group";
import { TimeSeparator } from "./time-separator";
import { TypingIndicator } from "./typing-indicator";

interface MessageListProps {
	messages: ChatMessage[];
	loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	const groups = groupMessages(messages);

	return (
		<ScrollArea className="min-h-0 flex-1">
			<div className="flex flex-col gap-4 px-4 py-3 pt-20">
				{groups.map((group, gi) => {
					const prevGroup = groups[gi - 1];
					const showSeparator =
						gi === 0 ||
						(prevGroup &&
							shouldShowTimeSeparator(
								prevGroup.messages[prevGroup.messages.length - 1]!.timestamp,
								group.messages[0]!.timestamp
							));

					return (
						<div key={group.messages[0]!.timestamp + gi}>
							{showSeparator && <TimeSeparator timestamp={group.messages[0]!.timestamp} />}
							<MessageGroup group={group} />
						</div>
					);
				})}
				{loading && <TypingIndicator />}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
