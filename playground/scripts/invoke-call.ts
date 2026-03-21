import { deepseekModel } from "./models";

const response = await deepseekModel.invoke([
  ["system", "你是一个面向前端开发者的 AI 助手，回答要清晰、简洁。"],
  ["human", "请用两句话确认 LangChain 与 DeepSeek 的连接已经正常。"],
]);

console.log("invoke result:");
console.log(response.content);
console.log(response.response_metadata);
console.log(response.usage_metadata);
