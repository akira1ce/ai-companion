import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableBranch, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { deepseekModel } from "../models";
const parser = new StringOutputParser();

// 1. 意图分类链
const classifyPrompt = ChatPromptTemplate.fromMessages([
  ["system", `判断用户消息的意图，只输出类别名：tech / emotional / casual`],
  ["human", "{input}"],
]);
const classifyChain = classifyPrompt.pipe(deepseekModel).pipe(parser);

// 2. 三条专用回复链
const techPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个前端技术专家，用简洁准确的语言回答技术问题。"],
  ["human", "{input}"],
]);
const techChain = techPrompt.pipe(deepseekModel).pipe(parser);

const emotionalPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个温暖的倾听者。先共情用户的感受，再给出积极的建议。"],
  ["human", "{input}"],
]);
const emotionalChain = emotionalPrompt.pipe(deepseekModel).pipe(parser);

const casualPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个轻松有趣的聊天伙伴。"],
  ["human", "{input}"],
]);
const casualChain = casualPrompt.pipe(deepseekModel).pipe(parser);

// 3. 组装：先分类，再路由
const chain = RunnablePassthrough.assign({ intent: classifyChain }).pipe(
  RunnableBranch.from([
    [({ intent }: { intent: string }) => intent.trim() === "tech", techChain],
    [({ intent }: { intent: string }) => intent.trim() === "emotional", emotionalChain],
    casualChain,
  ]),
);

// 4. 执行
const reply = await chain.invoke({
  input: "今天开会被否了三次，心里有点堵。",
});
console.log(reply);
// 意图分类为 "emotional"，走 emotionalChain
// → "听起来今天挺不容易的，连续被否定确实让人沮丧..."
