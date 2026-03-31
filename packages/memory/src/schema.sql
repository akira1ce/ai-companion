-- D1 schema for ai-companion

-- Sessions: 核心实体，所有数据挂在 session 下
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,     -- session_id
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, updated_at DESC);

-- Memories: 长期记忆（事实、事件、摘要等）
CREATE TABLE IF NOT EXISTS memories (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  type        TEXT NOT NULL, -- 'profile'|'event'|'fact'|'summary'|'keyword'
  content     TEXT NOT NULL,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_session_type ON memories(session_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_session_created ON memories(session_id, created_at DESC);

-- Messages: 聊天消息
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  role        TEXT NOT NULL, -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at ASC);
