import { ConversationSummaryBufferMemory } from "@langchain/classic/memory";
import { CloudflareD1MessageHistory } from "@langchain/cloudflare";
import { deepseekModel } from "../../models";

declare const env: { DB: any };

export interface UserProfile {
  name: string;
  occupation: string;
  interests: string[];
  recentEvents: string[];
  emotionTrend: string;
}

export const shortTermMemory = new ConversationSummaryBufferMemory({
  /* 这个模型不只是负责回复，也负责在需要时生成摘要 */
  llm: deepseekModel,
  /* 超过这个 token 限制后，更早的消息会被压缩 */
  maxTokenLimit: 500,
  returnMessages: true,
  memoryKey: "history",
  chatHistory: new CloudflareD1MessageHistory({
    /* D1 里用这张表保存短期聊天历史 */
    tableName: "langchain_chat_histories",
    /* 用当前会话 id 隔离不同对话 */
    sessionId: "user-123-session-current",
    database: env.DB,
  }),
});

/* 加载用户画像 */
export async function loadUserProfile(userId: string): Promise<UserProfile> {
  return {
    name: "小明",
    occupation: "前端开发",
    interests: ["跑步", "看电影", "写代码"],
    recentEvents: ["上周面试了字节跳动，还在等结果", "最近在学 LangChain"],
    emotionTrend: "最近一周情绪偏平稳，偶尔因为工作压力感到焦虑",
  };
}
