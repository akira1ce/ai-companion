import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

async function extractLongTermMemory(conversationHistory: string) {
  /* 1. 先把提取目标写清楚，告诉模型哪些信息值得长期保留 */
  const extractionPrompt = `请从以下对话中提取值得长期记住的信息。

对话内容：
${conversationHistory}

请以 JSON 格式返回，包含以下字段（没有的字段留空数组）：
- facts: 关于用户的事实信息（职业、年龄、家庭等）
- events: 重要事件（面试、旅行、冲突等）
- preferences: 用户偏好（喜欢/不喜欢什么）
- emotionSnapshot: 本次对话的整体情绪状态（一句话描述）`;

  /* 2. 让模型先生成结果 */
  const response = await model.invoke(extractionPrompt);
  /* 3. 再把模型输出解析成结构化 JSON */
  const parser = new JsonOutputParser();
  return await parser.invoke(response);
}

const extracted = await extractLongTermMemory(`
Human: 我今天面试了字节跳动
AI: 面试感觉怎么样？
Human: 还行吧，二面，聊了一个小时，主要问了 React 和系统设计
AI: 一个小时的二面内容挺充实的，React 和系统设计都是你的强项...
Human: 希望能过吧，等结果有点焦虑
`);

// {
//   facts: ["用户正在求职，目标公司包括字节跳动"],
//   events: ["参加了字节跳动的二面，聊了 React 和系统设计，时长一小时"],
//   preferences: [],
//   emotionSnapshot: "因为等待面试结果而感到焦虑"
// }
