import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MemoryDocument } from '@ai-companion/types';
import { randomUUID } from 'node:crypto';

interface ExtractedMemory {
  type: 'event' | 'fact' | 'keyword';
  content: string;
}

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `从以下对话中提取值得长期记忆的信息。
只提取明确的事实、重要事件、关键词，不要泛化推断。
输出 JSON 数组，每项格式：{"type": "event|fact|keyword", "content": "..."}
如果没有值得记忆的内容，输出空数组 []`,
  ],
  ['human', '对话记录：\n{conversation}'],
]);

export async function extractMemories(
  model: BaseChatModel,
  userId: string,
  userMessage: string,
  assistantReply: string,
): Promise<MemoryDocument[]> {
  const conversation = `用户：${userMessage}\n助手：${assistantReply}`;
  const chain = prompt.pipe(model).pipe(new JsonOutputParser<ExtractedMemory[]>());

  try {
    const items = await chain.invoke({ conversation });
    if (!Array.isArray(items)) return [];

    return items
      .filter((m) => m.content?.trim())
      .map((m) => ({
        id: randomUUID(),
        type: m.type,
        content: m.content.trim(),
        metadata: { userId },
        createdAt: Date.now(),
      }));
  } catch {
    return [];
  }
}
