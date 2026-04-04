import type { EmotionState } from "@ai-companion/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EMOTION_MAP: Record<EmotionState, { label: string; emoji: string; className: string }> = {
	calm: { label: "平静", emoji: "😌", className: "bg-gray-100 text-gray-600" },
	happy: { label: "开心", emoji: "😊", className: "bg-amber-50 text-amber-600" },
	angry: { label: "生气", emoji: "😤", className: "bg-red-50 text-red-600" },
	sad: { label: "难过", emoji: "😢", className: "bg-blue-50 text-blue-600" },
	shy: { label: "害羞", emoji: "🫣", className: "bg-pink-50 text-pink-600" },
	jealous: { label: "吃醋", emoji: "😒", className: "bg-green-50 text-green-600" },
};

interface EmotionBadgeProps {
	state: EmotionState;
	intensity: number;
}

export function EmotionBadge({ state, intensity }: EmotionBadgeProps) {
	const info = EMOTION_MAP[state];

	return (
		<Badge variant="secondary" className={cn("gap-1 border-0 font-normal", info.className)}>
			{info.emoji} {info.label}
		</Badge>
	);
}
