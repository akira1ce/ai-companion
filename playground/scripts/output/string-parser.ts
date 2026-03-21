import { ChatPromptTemplate } from "@langchain/core/prompts";
import { deepseekModel } from "../models";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个前端学习助手，回答控制在 3 句话内。"],
  ["human", "{input}"],
]);

const chain = prompt.pipe(deepseekModel).pipe(new StringOutputParser());

const text = await chain.invoke({
  input: "为什么 useActionState 适合处理表单提交？",
});

console.log(text);
