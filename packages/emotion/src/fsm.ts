import type { EmotionState, EmotionEvent, EmotionContext } from '@ai-companion/types';

export interface TransitionResult {
  context: EmotionContext;
  transitioned: boolean;
  fromState: EmotionState;
}

interface TransitionRule {
  event: EmotionEvent;
  nextState: EmotionState;
  intensityDelta: number;
  intimacyThreshold?: number; // min intimacy required to trigger
  cooldownMs?: number;
}

// 状态转移规则表
const TRANSITION_RULES: Record<EmotionState, TransitionRule[]> = {
  calm: [
    { event: 'praise',        nextState: 'happy',   intensityDelta: 30 },
    { event: 'gift',          nextState: 'happy',   intensityDelta: 40 },
    { event: 'ignored',       nextState: 'angry',   intensityDelta: 25 },
    { event: 'argument',      nextState: 'angry',   intensityDelta: 50 },
    { event: 'neglect',       nextState: 'sad',     intensityDelta: 20 },
    { event: 'confession',    nextState: 'shy',     intensityDelta: 60, intimacyThreshold: 30 },
    { event: 'intimate',      nextState: 'shy',     intensityDelta: 40, intimacyThreshold: 20 },
    { event: 'mention_other', nextState: 'jealous', intensityDelta: 35, intimacyThreshold: 40 },
    { event: 'comfort',       nextState: 'happy',   intensityDelta: 20 },
    { event: 'apology',       nextState: 'calm',    intensityDelta: 0 },
  ],
  happy: [
    { event: 'ignored',       nextState: 'angry',   intensityDelta: 30 },
    { event: 'argument',      nextState: 'angry',   intensityDelta: 50 },
    { event: 'confession',    nextState: 'shy',     intensityDelta: 50, intimacyThreshold: 30 },
    { event: 'intimate',      nextState: 'shy',     intensityDelta: 40, intimacyThreshold: 20 },
    { event: 'mention_other', nextState: 'jealous', intensityDelta: 30, intimacyThreshold: 40 },
    { event: 'praise',        nextState: 'happy',   intensityDelta: 10 },
    { event: 'gift',          nextState: 'happy',   intensityDelta: 15 },
    { event: 'neglect',       nextState: 'sad',     intensityDelta: 20 },
  ],
  angry: [
    { event: 'apology',       nextState: 'calm',    intensityDelta: -60 },
    { event: 'comfort',       nextState: 'calm',    intensityDelta: -30 },
    { event: 'gift',          nextState: 'calm',    intensityDelta: -40, intimacyThreshold: 50 },
    { event: 'ignored',       nextState: 'angry',   intensityDelta: 20 },
    { event: 'argument',      nextState: 'angry',   intensityDelta: 20 },
    { event: 'neglect',       nextState: 'sad',     intensityDelta: 30 },
  ],
  sad: [
    { event: 'comfort',       nextState: 'calm',    intensityDelta: -40 },
    { event: 'praise',        nextState: 'calm',    intensityDelta: -20 },
    { event: 'gift',          nextState: 'happy',   intensityDelta: 30 },
    { event: 'neglect',       nextState: 'sad',     intensityDelta: 20 },
    { event: 'ignored',       nextState: 'sad',     intensityDelta: 15 },
  ],
  shy: [
    { event: 'praise',        nextState: 'happy',   intensityDelta: 20 },
    { event: 'ignored',       nextState: 'sad',     intensityDelta: 25 },
    { event: 'argument',      nextState: 'angry',   intensityDelta: 30 },
    { event: 'intimate',      nextState: 'shy',     intensityDelta: 10 },
    { event: 'confession',    nextState: 'shy',     intensityDelta: 15 },
    { event: 'mention_other', nextState: 'jealous', intensityDelta: 25, intimacyThreshold: 40 },
  ],
  jealous: [
    { event: 'apology',       nextState: 'calm',    intensityDelta: -40 },
    { event: 'comfort',       nextState: 'calm',    intensityDelta: -30 },
    { event: 'praise',        nextState: 'calm',    intensityDelta: -20 },
    { event: 'gift',          nextState: 'happy',   intensityDelta: 20 },
    { event: 'mention_other', nextState: 'angry',   intensityDelta: 40 },
    { event: 'intimate',      nextState: 'shy',     intensityDelta: 30, intimacyThreshold: 40 },
  ],
};

// 默认冷却期 5 分钟，防止状态抖动
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

export class EmotionFSM {
  /**
   * 根据事件触发状态转移，返回新的情绪上下文
   * 冷却期内或无匹配规则时不转移
   */
  transition(ctx: EmotionContext, event: EmotionEvent): TransitionResult {
    const now = Date.now();
    const fromState = ctx.state;

    // 冷却期检查（防抖动）
    if (ctx.cooldownUntil !== undefined && now < ctx.cooldownUntil) {
      return { context: ctx, transitioned: false, fromState };
    }

    const rules = TRANSITION_RULES[ctx.state];
    const rule = rules.find((r) => r.event === event);

    if (!rule) {
      return { context: ctx, transitioned: false, fromState };
    }

    // 亲密度阈值检查
    if (rule.intimacyThreshold !== undefined && ctx.intimacy < rule.intimacyThreshold) {
      return { context: ctx, transitioned: false, fromState };
    }

    const transitioned = rule.nextState !== ctx.state;
    const newIntensity = Math.min(100, Math.max(0, ctx.intensity + rule.intensityDelta));

    const newCtx: EmotionContext = {
      ...ctx,
      state: rule.nextState,
      intensity: newIntensity,
      updatedAt: now,
      cooldownUntil: transitioned
        ? now + (rule.cooldownMs ?? DEFAULT_COOLDOWN_MS)
        : ctx.cooldownUntil,
    };

    return { context: newCtx, transitioned, fromState };
  }

  /** 构造初始情绪上下文 */
  static initial(intimacy = 0): EmotionContext {
    return {
      state: 'calm',
      intensity: 0,
      intimacy,
      updatedAt: Date.now(),
    };
  }
}
