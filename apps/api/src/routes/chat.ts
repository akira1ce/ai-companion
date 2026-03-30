import type { Context } from 'hono';
import { HybridRetriever, MemoryWriter } from '@ai-companion/memory';
import { EmotionFSM, IntimacySystem, applyDecay } from '@ai-companion/emotion';
import { assemblePrompt } from '@ai-companion/prompt';
import type {
  ChatRequest,
  ChatResponse,
  EmotionContext,
  UserProfile,
} from '@ai-companion/types';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Env } from '../index.js';
import { createChatModel, createEmbeddings } from '../lib/model.js';
import { classifyEmotionEvent } from '../lib/emotion-classifier.js';
import { extractMemories } from '../lib/memory-extractor.js';

const fsm = new EmotionFSM();
const intimacy = new IntimacySystem();

const DEFAULT_EMOTION: EmotionContext = {
  state: 'calm',
  intensity: 0,
  intimacy: 50,
  updatedAt: Date.now(),
};

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: '你',
};

async function loadEmotionContext(kv: Env['KV'], userId: string): Promise<EmotionContext> {
  const raw = await kv.get(`emotion:${userId}`);
  if (!raw) return { ...DEFAULT_EMOTION, updatedAt: Date.now() };
  try {
    return JSON.parse(raw) as EmotionContext;
  } catch {
    return { ...DEFAULT_EMOTION, updatedAt: Date.now() };
  }
}

async function saveEmotionContext(kv: Env['KV'], userId: string, ctx: EmotionContext) {
  await kv.put(`emotion:${userId}`, JSON.stringify(ctx));
}

async function loadUserProfile(kv: Env['KV'], userId: string): Promise<UserProfile> {
  const raw = await kv.get(`profile:${userId}`);
  if (!raw) return { ...DEFAULT_PROFILE, id: userId };
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return { ...DEFAULT_PROFILE, id: userId };
  }
}

export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
  const body = await c.req.json<ChatRequest>();
  const { userId, message, sessionId } = body;

  if (!userId || !message || !sessionId) {
    return c.json({ error: 'userId, message, sessionId are required' }, 400);
  }

  const env = c.env;
  const model = createChatModel(env);
  const embeddings = createEmbeddings(env);

  const embedFn = { embed: (text: string) => embeddings.embedQuery(text) };

  const retriever = new HybridRetriever({ vectorize: env.VECTORIZE, db: env.DB, kv: env.KV, embedFn });
  const writer = new MemoryWriter({ vectorize: env.VECTORIZE, db: env.DB, kv: env.KV, embedFn });

  // 1. Load + decay emotion
  const rawEmotion = await loadEmotionContext(env.KV, userId);
  const emotion = applyDecay(rawEmotion);

  // 2. Load user profile
  const userProfile = await loadUserProfile(env.KV, userId);

  // 3. Parallel: classify emotion event + retrieve memories
  const [emotionEvent, memories] = await Promise.all([
    classifyEmotionEvent(model, message),
    retriever.retrieve({ text: message, userId, topK: 5 }),
  ]);

  // 4. Transition FSM
  let updatedEmotion = emotion;
  if (emotionEvent) {
    const { context: nextCtx } = fsm.transition(emotion, emotionEvent);
    const newIntimacy = intimacy.updateFromEmotion(nextCtx.intimacy, nextCtx.state);
    updatedEmotion = { ...nextCtx, intimacy: newIntimacy };
  }

  // 5. Assemble system prompt
  const systemPrompt = assemblePrompt({ emotion: updatedEmotion, memories, userProfile });

  // 6. Load session history from KV
  const session = await writer.readSessionContext(userId);
  const historyMessages = session.messages.map((m) =>
    m.role === 'user' ? new HumanMessage(m.content) : new SystemMessage(m.content),
  );

  // 7. Call LLM
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...historyMessages,
    new HumanMessage(message),
  ]);
  const reply = typeof response.content === 'string' ? response.content : String(response.content);

  // 8. Sync writes (session context + emotion state)
  await Promise.all([
    writer.writeSessionContext(userId, {
      messages: [
        ...session.messages,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ].slice(-20), // keep last 20 turns
    }),
    saveEmotionContext(env.KV, userId, updatedEmotion),
  ]);

  // 9. Async memory extraction (non-blocking)
  c.executionCtx.waitUntil(
    extractMemories(model, userId, message, reply).then((docs) => {
      if (docs.length > 0) return writer.writeMemoryAsync(userId, docs);
    }),
  );

  const result: ChatResponse = {
    reply,
    emotion: updatedEmotion,
    sessionId,
  };
  return c.json(result);
}
