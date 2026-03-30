import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnablePassthrough } from "@langchain/core/runnables";
import { loadUserProfile, shortTermMemory } from "./hybird-memory";
import { prompt } from "./hybird-pormpt";
import { deepseekModel } from "../../models";

/* 从短期记忆中加载会话历史 */
const loadHistoryRunnable = RunnableLambda.from(async () => {
  const vars = await shortTermMemory.loadMemoryVariables({});
  return vars.history ?? [];
});

/* 从用户画像中加载用户信息 */
const loadUserProfileRunnable = RunnableLambda.from(async () => {
  const profile = await loadUserProfile("user-123");
  return {
    occupation: profile.occupation,
    interests: profile.interests.join("、"),
    recentEvents: profile.recentEvents.join("；"),
    emotionTrend: profile.emotionTrend,
  };
});

const chain = RunnablePassthrough.assign({
  /* 把 history 字段补到输入对象里，供 Prompt 使用 */
  history: loadHistoryRunnable,
})
  .assign({
    ...loadUserProfileRunnable,
  })
  /* 到这里为止，输入对象已经变成： */
  // { input, history, occupation, interests, recentEvents, emotionTrend }
  .pipe(prompt)
  .pipe(deepseekModel)
  .pipe(new StringOutputParser());

export async function chat(input: string) {
  /* 1. 用组装好的链生成回复 */
  const response = await chain.invoke({ input });
  /* 2. 再把这一轮输入输出写回短期记忆 */
  await shortTermMemory.saveContext({ input }, { output: response });
  return response;
}

await chat("小明最近在学什么技术？ ");

`
会话开始
  │
  ├─ 读取短期记忆（D1 聊天历史表）→ 恢复上次会话的对话上下文
  ├─ 读取长期记忆（D1 画像 / 事件表）→ 加载用户画像和历史事件
  │
  ▼
对话进行中
  │
  ├─ 每轮实时更新短期记忆
  │
  ▼
会话结束
  │
  ├─ 从本次对话中提取长期记忆
  ├─ 更新 D1 中的用户画像和记忆表
  └─ 下次会话继续从 D1 恢复
`;
