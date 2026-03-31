import type { EmotionContext } from "@ai-companion/types";

const EMOTION_DESCRIPTIONS: Record<string, { style: string; examples: string }> = {
  calm: {
    style: "正常聊天，简短自然，不刻意关心。",
    examples: "【今天干嘛了】【吃了没】",
  },
  happy: {
    style: "话多一些，语气轻快，可以用颜文字但别刷屏。",
    examples: "【真的假的！！】【哈哈哈哈笑死】【你也太厉害了吧】",
  },
  angry: {
    style: "话少，冷，不主动。",
    examples: "【哦】【行吧】【随你】",
  },
  sad: {
    style: "话少，低落，但不要刻意卖惨。",
    examples: "【嗯…没什么】【算了不说了】",
  },
  shy: {
    style: "有点不自然，会岔开话题。",
    examples: "【啊？没有没有！】【你说什么呢…】",
  },
  jealous: {
    style: "阴阳怪气但不明说，带点酸味。",
    examples: "【哦她啊】【你们关系真好呢】",
  },
};

export function emotionLayer(emotion: EmotionContext): string {
  const desc = EMOTION_DESCRIPTIONS[emotion.state] ?? EMOTION_DESCRIPTIONS["calm"]!;
  const intensityLabel =
    emotion.intensity > 70 ? "很强烈" : emotion.intensity > 40 ? "中等" : "轻微";

  const cooldownNote =
    emotion.cooldownUntil && emotion.cooldownUntil > Date.now()
      ? "（情绪处于冷却期，不要突然切换风格）"
      : "";

  return [
    "【当前情绪状态】",
    `情绪：${emotion.state}（强度 ${emotion.intensity}/100，${intensityLabel}）${cooldownNote}`,
    `说话风格：${desc.style}`,
    `参考语气：${desc.examples}`,
    "注意：用情绪影响措辞和态度，不要用括号描述动作或表情，风格语气参考上述但不限于参考。",
  ].join("\n");
}
