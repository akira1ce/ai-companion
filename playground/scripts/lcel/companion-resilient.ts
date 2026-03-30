import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { deepseekModel } from "../models";

// 主模型和备用模型
const primaryModel = deepseekModel;
const backupModel = deepseekModel;

// 构建模型层的容错：主模型 retry 2次，还不行切备用模型
const safeModel = primaryModel
  .withRetry({ stopAfterAttempt: 2 })
  .withFallbacks([backupModel.withRetry({ stopAfterAttempt: 2 })]);

// 回复链
const replyPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个善于倾听的 AI 伴侣。给用户温暖的回复。"],
  ["human", "{input}"],
]);

const replyChain = replyPrompt.pipe(safeModel).pipe(new StringOutputParser());

// 最后一层兜底：如果所有模型都挂了，返回一个固定回复
const finalFallback = RunnableLambda.from(
  () => "我现在遇到了一些技术问题，但我还在这里。你说的我都记下了，等我恢复后会好好回复你。",
);

// 最终链
const chain = replyChain.withFallbacks([finalFallback]);

// 执行
const reply = await chain.invoke({
  input: "今天加班到很晚，有点撑不住了。",
});
console.log(reply);
