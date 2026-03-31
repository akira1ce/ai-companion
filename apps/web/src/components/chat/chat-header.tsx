import type { EmotionContext, EmotionState } from "@ai-companion/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmotionBadge } from "./emotion-badge";

interface ChatHeaderProps {
	emotion: EmotionContext;
}

export function ChatHeader({ emotion }: ChatHeaderProps) {
	return (
		<header className="sticky top-0 z-10 flex items-center justify-between bg-white/60 px-4 py-2.5 backdrop-blur-[20px] backdrop-saturate-180">
			<div className="flex items-center gap-3">
				<Avatar className="h-10 w-10">
					<AvatarFallback className="bg-linear-to-br from-sky-300 to-emerald-300 text-sm font-bold text-white">
						薇
					</AvatarFallback>
				</Avatar>
				<div>
					<h1 className="text-[17px] leading-tight font-semibold">小薇</h1>
					<p className="text-chat-muted text-[13px]">AI 伴侣</p>
				</div>
			</div>
			<EmotionBadge state={emotion.state as EmotionState} intensity={emotion.intensity} />
		</header>
	);
}
