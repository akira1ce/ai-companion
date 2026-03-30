import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough } from "@langchain/core/runnables";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers";
import { deepseekModel } from "../models";

// 情绪判断链
const emotionPrompt = ChatPromptTemplate.fromMessages([
  ["system", '分析用户的情绪状态，输出 JSON：{{ "emotion": string, "confidence": number }}'],
  ["human", "{input}"],
]);
const emotionChain = emotionPrompt.pipe(deepseekModel).pipe(new JsonOutputParser());

// 关键词提取链
const keywordPrompt = ChatPromptTemplate.fromMessages([
  ["system", "提取用户消息中的关键词，输出 JSON 数组"],
  ["human", "{input}"],
]);
const keywordChain = keywordPrompt.pipe(deepseekModel).pipe(new JsonOutputParser());

// 回复链
const replyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个善于倾听的 AI 伴侣。
根据以下上下文，给用户一个温暖、有针对性的回复。

用户情绪：{emotion}
关键词：{keywords}
`,
  ],
  ["human", "{input}"],
]);

// 组装完整链路
const chain = RunnablePassthrough.assign({
  emotion: emotionChain,
  keywords: keywordChain,
})
  .pipe(replyPrompt)
  .pipe(deepseekModel)
  .pipe(new StringOutputParser());

// 执行
const reply = await chain.invoke({
  input: "今天开会被否了三次，我有点乱。",
});

console.log(reply);
// "听起来今天挺不容易的。连续被否定确实会让人心里乱..."
