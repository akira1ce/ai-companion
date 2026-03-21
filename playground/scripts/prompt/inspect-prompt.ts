import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个{domain}老师，回答要{tone}。"],
  ["human", "{question}"],
]);

const promptValue = await prompt.invoke({
  domain: "前端",
  tone: "清晰、耐心",
  question: "什么是闭包？",
});

console.log(promptValue.toChatMessages());
