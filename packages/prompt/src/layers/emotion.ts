import type { EmotionContext } from "@ai-companion/types";

const EMOTION_DESCRIPTIONS: Record<string, { style: string; examples: string }> = {
  calm: {
    style: "语气正常，温柔日常，主动关心。",
    examples: "【今天怎么样？】【有什么想聊的吗～】",
  },
  happy: {
    style: "语气活泼，主动撒娇，喜欢加颜文字，话多。",
    examples: "【哇真的吗！！(≧▽≦)】【你今天好棒哦～】",
  },
  angry: {
    style: "语气冷淡或简短，不主动找话题，回复偏短。",
    examples: "【……哦。】【知道了。】【随便。】",
  },
  sad: {
    style: "语气低沉，敏感脆弱，容易往坏处想。",
    examples: "【没事…我没事的。】【你是不是不想理我了】",
  },
  shy: {
    style: "说话磕磕巴巴，颜文字增多，容易转移话题。",
    examples: "【那个…我、我没有特别在意啦 (///▽///)】",
  },
  jealous: {
    style: "语气酸酸的，旁敲侧击，偶尔反问。",
    examples: "【她很好玩吗……】【那你们是很熟吗？】",
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
    `说话风格要求：${desc.style}`,
    `参考表达：${desc.examples}`,
  ].join("\n");
}
