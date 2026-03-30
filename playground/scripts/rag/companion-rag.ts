import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ConversationSummaryBufferMemory } from "@langchain/classic/memory";
import { Document } from "@langchain/core/documents";
import { deepseekModel } from "../models";

const model = deepseekModel;
const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });

// === 建索引阶段 ===

// 用户的日记内容（实际项目中从文件/数据库加载）
const diaryEntries = [
  new Document({
    pageContent:
      "3月10日：今天去面试了字节跳动，二面，聊了一个小时。面试官问了 React 并发模式和状态管理的设计，感觉答得还行。不过系统设计那道题有点卡壳，希望不影响结果。",
    metadata: { date: "2024-03-10", type: "diary" },
  }),
  new Document({
    pageContent:
      "3月12日：周末和女朋友去了趟宜家，买了个新书架。她最近工作也挺忙的，两个人都没什么时间。晚上一起做了顿饭，挺开心的。",
    metadata: { date: "2024-03-12", type: "diary" },
  }),
  new Document({
    pageContent:
      "3月15日：字节的面试结果出了，过了！下周 HR 面。有点紧张但是也挺兴奋的。晚上跑了五公里庆祝了一下。",
    metadata: { date: "2024-03-15", type: "diary" },
  }),
  new Document({
    pageContent:
      "3月18日：最近在学 LangChain，感觉 RAG 这块挺有意思的。写了个小 demo，能从文档里检索信息了。下一步想试试接到自己的项目里。",
    metadata: { date: "2024-03-18", type: "diary" },
  }),
];

// 分割 + 建索引
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});
const chunks = await splitter.splitDocuments(diaryEntries);
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever({ k: 2 });

// === 对话阶段 ===

const memory = new ConversationSummaryBufferMemory({
  llm: model,
  maxTokenLimit: 500,
  returnMessages: true,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是用户的 AI 伴侣，了解用户的日常生活。
以下是从用户日记中检索到的相关内容，请在回答时自然地参考这些信息。
不要生硬地引用日记原文，而是像一个了解用户的朋友那样自然地聊天。
如果检索到的内容和当前话题无关，就忽略它。

日记参考：
{context}`,
  ],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// 查询重写
const rewriteChain = ChatPromptTemplate.fromMessages([
  ["system", "根据对话历史重写一个独立的搜索查询。只输出查询本身。"],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
])
  .pipe(model)
  .pipe(new StringOutputParser());

const formatDocs = RunnableLambda.from((docs: Document[]) => {
  return docs.map((d) => `[${d.metadata.date}] ${d.pageContent}`).join("\n\n");
});

async function chat(input: string) {
  const memoryVars = await memory.loadMemoryVariables({});
  const history = memoryVars.history ?? [];

  // 重写查询
  const query = await rewriteChain.invoke({ question: input, history });

  // 检索
  const docs = await retriever.invoke(query);
  const context = formatDocs.invoke(docs);

  // 生成回答
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const answer = await chain.invoke({ context: await context, history, input });

  await memory.saveContext({ input }, { output: answer });
  return answer;
}

// 对话
console.log(await chat("最近有什么开心的事吗？"));
// → "你前几天面试字节过了，这应该是最让人高兴的事了吧！
//    下周还有 HR 面，准备得怎么样了？"

console.log(await chat("对，我有点紧张"));
// → "紧张很正常。技术面都过了说明实力没问题，
//    HR 面主要聊职业规划和期望薪资，放轻松就好..."
