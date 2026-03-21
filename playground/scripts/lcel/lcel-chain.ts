import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnablePassthrough } from "@langchain/core/runnables";
import { deepseekModel } from "../models";

const enrichInput = RunnablePassthrough.assign({
  trimmedInput: ({ input }: { input: string }) => input.trim(),
});

const detectPriority = new RunnableLambda({
  func: ({ trimmedInput }: { trimmedInput: string }) => {
    const priority = trimmedInput.includes("线上") ? "high" : "normal";
    return {
      trimmedInput,
      priority,
    };
  },
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "你是一个前端 AI 伴侣。根据 priority 调整回应力度：high 时先稳定情绪，再给一个动作建议。",
  ],
  ["human", "priority={priority}\ninput={trimmedInput}"],
]);

const chain = enrichInput
  .pipe(detectPriority)
  .pipe(prompt)
  .pipe(deepseekModel)
  .pipe(new StringOutputParser());

const result = await chain.invoke({
  input: "  线上刚出故障，今晚估计又得加班。  ",
});

console.log(result);
