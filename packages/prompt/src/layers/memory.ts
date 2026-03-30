import type { MemoryDocument } from '@ai-companion/types';

export function memoryLayer(memories: MemoryDocument[]): string {
  if (memories.length === 0) return '';

  const formatted = memories
    .map((m) => {
      const date = new Date(m.createdAt).toLocaleDateString('zh-CN');
      return `- [${date}] ${m.content}`;
    })
    .join('\n');

  return [
    '【相关记忆】',
    '以下是与本次对话相关的历史记忆，请自然地融入回复中，不要逐条念出：',
    formatted,
  ].join('\n');
}
