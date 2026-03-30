import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { deepseekModel } from "../models";

const model = deepseekModel;
const parser = new StringOutputParser();

// Map 阶段：对每个文档块单独提问
// !mark(1:10)
const mapPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `根据以下文档片段，回答用户的问题。
如果这个片段里没有相关信息，回答"无相关信息"。

文档片段：
{chunk}`,
  ],
  ["human", "{question}"],
]);

const mapChain = mapPrompt.pipe(model).pipe(parser);

// Reduce 阶段：汇总所有小回答
// !mark(1:7)
const reducePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `以下是多个文档片段对同一问题的分别回答。
请综合这些回答，生成一个完整、准确的最终回答。
忽略"无相关信息"的部分。

各片段的回答：
{summaries}`,
  ],
  ["human", "{question}"],
]);

const reduceChain = reducePrompt.pipe(model).pipe(parser);

// 完整的 MapReduce 流程
// !mark(1:16)
async function mapReduceRAG(question: string, docs: Document[]) {
  // Map：并行处理每个文档块
  const mapResults = await Promise.all(
    docs.map((doc) => mapChain.invoke({ chunk: doc.pageContent, question })),
  );

  // Reduce：汇总
  const summaries = mapResults
    .filter((r) => r !== "无相关信息")
    .map((r, i) => `[${i + 1}] ${r}`)
    .join("\n\n");

  return await reduceChain.invoke({ summaries, question });
}
