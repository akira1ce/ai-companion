"use client";

import { PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { USER_ID } from "@/constants";
import { cn } from "@/lib/utils";
import { conversationActions, useConversation } from "@/stores/conversation";

export interface SiderPanelProps {
	className?: string;
}

export function SiderPanel({ className }: SiderPanelProps) {
	const { sessions, current } = useConversation();

	const handleNewSession = () => {
		conversationActions.setCurrent(null);
	};

	useEffect(() => {
		conversationActions.loadSessions(USER_ID);
	}, []);

	return (
		<div className={cn("bg-sidebar flex w-80 flex-col space-y-4 p-4", className)}>
			<div>ai companion</div>
			<Button className={"w-full"} variant="outline" size="icon" onClick={handleNewSession}>
				<PlusIcon /> New Session
			</Button>
			<div className="flex-1 space-y-2 overflow-y-auto">
				{sessions.map((session) => (
					<div
						key={session.id}
						className={cn(
							"hover:bg-muted w-full cursor-pointer rounded-md p-2",
							current === session.id ? "bg-muted" : ""
						)}
						onClick={() => conversationActions.setCurrent(session.id)}
					>
						{session.title || session.id.slice(0, 8) || "New Session"}
					</div>
				))}
			</div>
		</div>
	);
}
