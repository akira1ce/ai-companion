import type { Context } from 'hono';
import type { Env } from '../index.js';

export async function handleGetMessages(c: Context<{ Bindings: Env }>): Promise<Response> {
  const userId = c.req.param('userId');
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 100);

  const rows = await c.env.DB.prepare(
    'SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
  )
    .bind(userId, limit)
    .all<{ role: string; content: string; created_at: number }>();

  const messages = (rows.results ?? []).reverse().map((r) => ({
    role: r.role,
    content: r.content,
    timestamp: r.created_at,
  }));

  return c.json({ messages });
}
