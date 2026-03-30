import type { EmotionContext } from '@ai-companion/types';

// 情绪强度半衰期（毫秒）—— 不同情绪衰减速度不同
const HALF_LIFE_MS: Record<string, number> = {
  calm:    Infinity,              // 平静不衰减
  happy:   2 * 60 * 60 * 1000,   // 2 小时
  angry:   4 * 60 * 60 * 1000,   // 4 小时（生气消散慢）
  sad:     3 * 60 * 60 * 1000,   // 3 小时
  shy:     1 * 60 * 60 * 1000,   // 1 小时（害羞消散快）
  jealous: 3 * 60 * 60 * 1000,   // 3 小时
};

// 强度衰减到此值以下时，自动回到平静
const CALM_THRESHOLD = 10;

/**
 * 对情绪上下文应用时间衰减（半衰期模型）
 * 通常在每次会话开始时调用，将离线时间折算进来
 */
export function applyDecay(ctx: EmotionContext): EmotionContext {
  if (ctx.state === 'calm') return ctx;

  const now = Date.now();
  const elapsedMs = now - ctx.updatedAt;
  if (elapsedMs <= 0) return ctx;

  const halfLife = HALF_LIFE_MS[ctx.state] ?? 2 * 60 * 60 * 1000;
  if (!isFinite(halfLife)) return ctx;

  // N(t) = N0 * (0.5)^(t / t_half)
  const decayFactor = Math.pow(0.5, elapsedMs / halfLife);
  const newIntensity = ctx.intensity * decayFactor;

  if (newIntensity < CALM_THRESHOLD) {
    return {
      ...ctx,
      state: 'calm',
      intensity: 0,
      updatedAt: now,
      cooldownUntil: undefined,
    };
  }

  return {
    ...ctx,
    intensity: Math.round(newIntensity),
    updatedAt: now,
  };
}
