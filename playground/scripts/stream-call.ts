import { deepseekModel } from "./models";

const stream = await deepseekModel.stream([
  ["system", "你是一个面向前端开发者的 AI 助手，回答要自然、简洁。"],
  ["human", "请用一句话说明当前是流式输出验证。"],
]);

process.stdout.write("stream result:\n");

for await (const chunk of stream) {
  const text = typeof chunk.content === "string" ? chunk.content : "";
  process.stdout.write(text);
}

process.stdout.write("\n");
