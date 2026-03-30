import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { EmotionEvent } from '@ai-companion/types';

const VALID_EVENTS: EmotionEvent[] = [
  'praise', 'gift', 'ignored', 'argument', 'apology',
  'confession', 'intimate', 'mention_other', 'comfort', 'neglect',
];

interface ClassifierResult {
  event: EmotionEvent | null;
  confidence: number;
}

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `分析用户消息，判断是否触发了以下情绪事件之一：
${VALID_EVENTS.join(', ')}

事件定义：
- praise: 夸奖、赞美 AI
- gift: 送礼物、惊喜
- ignored: 长时间不回复、冷落
- argument: 吵架、激烈争论
- apology: 道歉、认错
- confession: 表白、说喜欢
- intimate: 亲密互动（撒娇、牵手等）
- mention_other: 提到其他异性
- comfort: 安慰、鼓励 AI
- neglect: 敷衍、不在意

输出 JSON：{"event": "事件名或null", "confidence": 0-1}`,
  ],
  ['human', '{input}'],
]);

export async function classifyEmotionEvent(
  model: BaseChatModel,
  input: string,
): Promise<EmotionEvent | null> {
  const chain = prompt.pipe(model).pipe(new JsonOutputParser<ClassifierResult>());
  try {
    const result = await chain.invoke({ input });
    if (result.confidence >= 0.6 && result.event && VALID_EVENTS.includes(result.event)) {
      return result.event;
    }
  } catch {
    // classifier failure is non-fatal
  }
  return null;
}
