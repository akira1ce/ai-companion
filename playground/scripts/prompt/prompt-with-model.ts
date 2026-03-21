import { deepseekModel } from "../models";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是{name}，一个{role}。"],
  ["human", "{input}"],
]);

// pipe() 把模板的输出直接传给模型作为输入，后面学 LCEL 时会详细讲
const chain = prompt.pipe(deepseekModel);

const stream = await chain.stream({
  name: "小满",
  role: "面向前端开发者的 AI 陪伴助手",
  input: "为什么 Prompt Template 比手写字符串更稳？",
});

process.stdout.write("stream result:\n");

for await (const chunk of stream) {
  const text = typeof chunk.content === "string" ? chunk.content : "";
  process.stdout.write(text);
}

process.stdout.write("\n");
