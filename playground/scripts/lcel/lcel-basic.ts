import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { deepseekModel } from "../models";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个前端学习助手，回答简洁。"],
  ["human", "{input}"],
]);

const parser = new StringOutputParser();

const chain = prompt.pipe(deepseekModel).pipe(parser);

const result = await chain.invoke({
  input: "解释一下 Runnable 为什么重要。",
});

console.log(result);
