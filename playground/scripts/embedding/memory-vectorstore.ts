import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

// 从 Document 数组创建向量存储
const vectorStore = await MemoryVectorStore.fromDocuments(
  [
    new Document({ pageContent: "useState 用于管理组件状态", metadata: { topic: "hooks" } }),
    new Document({ pageContent: "useEffect 处理副作用", metadata: { topic: "hooks" } }),
    new Document({ pageContent: "Zustand 是一个轻量状态管理库", metadata: { topic: "state" } }),
    new Document({ pageContent: "React Router 处理前端路由", metadata: { topic: "routing" } }),
  ],
  embeddings,
);

// 相似度搜索
const results = await vectorStore.similaritySearch("怎么在组件里管理状态", 2);

results.forEach((doc) => {
  console.log(doc.pageContent);
  console.log(doc.metadata);
});

// 输出最相关的 2 个文档（按相似度排序）：
// 1. "useState 用于管理组件状态"  ← 最相关
// 2. "Zustand 是一个轻量状态管理库"  ← 也和状态管理相关
