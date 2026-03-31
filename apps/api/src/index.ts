import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleChat } from './routes/chat.js';
import { handleGetMessages } from './routes/messages.js';

export type Env = {
  KV: KVNamespace;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL: string;
  DEEPSEEK_MODEL: string;
  LANGSMITH_API_KEY: string;
  LANGSMITH_PROJECT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors({ origin: '*' }));

app.get('/', (c) => c.json({ status: 'ok', service: 'ai-companion-api' }));

app.post('/chat', handleChat);

app.get('/messages/:userId', handleGetMessages);

app.get('/emotion/:userId', async (c) => {
  const userId = c.req.param('userId');
  const raw = await c.env.KV.get(`emotion:${userId}`);
  if (!raw) return c.json({ state: 'calm', intensity: 0, intimacy: 50 });
  return c.json(JSON.parse(raw));
});

export default app;
