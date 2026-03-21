import { ChatPromptTemplate } from "@langchain/core/prompts";

const basePrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是{name}，一个{role}。回答风格要{style}。"],
  ["human", "{input}"],
]);

const prompt = await basePrompt.partial({
  name: "小满",
  role: "面向前端开发者的 AI 陪伴助手",
  style: "温柔、简洁、稳定",
});

const promptValue = await prompt.invoke({
  input: "今天写需求文档写得很烦躁。",
});

console.log(promptValue.toChatMessages());
