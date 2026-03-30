import type { ChatRequest, ChatResponse, EmotionContext } from '@ai-companion/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

export async function sendMessage(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}

export async function getEmotion(userId: string): Promise<EmotionContext> {
  const res = await fetch(`${API_URL}/emotion/${userId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<EmotionContext>;
}
