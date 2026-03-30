import type { EmotionState } from '@ai-companion/types';

// 每种情绪状态对亲密度的影响（每次触发事件后累加）
const INTIMACY_DELTAS: Record<EmotionState, number> = {
  calm:    0,
  happy:   2,   // 开心时亲密度缓慢增长
  angry:  -3,   // 生气时亲密度受损
  sad:    -1,   // 难过时轻微受损
  shy:     3,   // 害羞时亲密感最强
  jealous:-1,   // 吃醋时轻微受损
};

export class IntimacySystem {
  /**
   * 根据当前情绪状态更新亲密度
   * 在每次情绪事件触发后调用
   */
  updateFromEmotion(intimacy: number, state: EmotionState): number {
    const delta = INTIMACY_DELTAS[state];
    return Math.min(100, Math.max(0, intimacy + delta));
  }

  /**
   * 亲密度影响情绪触发阈值的乘数
   * 亲密度越高，正面情绪越容易触发，负面情绪阈值越高
   */
  getTriggerMultiplier(intimacy: number, positive: boolean): number {
    const normalized = intimacy / 100; // 0-1
    return positive
      ? 1 + normalized * 0.5   // 亲密度高：正面情绪阈值降低（更容易触发）
      : 1 - normalized * 0.3;  // 亲密度高：负面情绪阈值升高（不容易触发）
  }
}
