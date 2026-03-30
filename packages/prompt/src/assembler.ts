import type { PromptContext } from '@ai-companion/types';
import { safetyLayer } from './layers/safety.js';
import { personaLayer } from './layers/persona.js';
import { emotionLayer } from './layers/emotion.js';
import { memoryLayer } from './layers/memory.js';

/**
 * 运行时组装四层 System Prompt:
 * 安全层 → 人设层 → 情绪层 → 记忆层
 */
export function assemblePrompt(ctx: PromptContext): string {
  return [
    safetyLayer(),
    personaLayer(ctx.userProfile),
    emotionLayer(ctx.emotion),
    memoryLayer(ctx.memories),
  ]
    .filter(Boolean)
    .join('\n\n');
}
