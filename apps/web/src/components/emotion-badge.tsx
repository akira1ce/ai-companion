import type { EmotionState } from '@ai-companion/types';

const EMOTION_CONFIG: Record<EmotionState, { label: string; classes: string }> = {
  calm:    { label: '😌 平静',  classes: 'bg-sky-100 text-sky-700' },
  happy:   { label: '😊 开心',  classes: 'bg-yellow-100 text-yellow-700' },
  angry:   { label: '😠 生气',  classes: 'bg-red-100 text-red-700' },
  sad:     { label: '😢 难过',  classes: 'bg-violet-100 text-violet-700' },
  shy:     { label: '🥺 害羞',  classes: 'bg-pink-100 text-pink-700' },
  jealous: { label: '😒 吃醋',  classes: 'bg-emerald-100 text-emerald-700' },
};

export function EmotionBadge({ state, intensity }: { state: EmotionState; intensity: number }) {
  const { label, classes } = EMOTION_CONFIG[state];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${classes}`}>
      {label}
      {state !== 'calm' && (
        <span className="text-xs opacity-60 bg-black/10 rounded-full px-1.5 py-0.5">{intensity}</span>
      )}
    </span>
  );
}
