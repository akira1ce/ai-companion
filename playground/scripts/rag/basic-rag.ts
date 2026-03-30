import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RunnablePassthrough, RunnableLambda } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { deepseekModel } from "../models";

const model = deepseekModel;

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });

// 准备一些文档（实际项目中从 Loader + Splitter 来）
const vectorStore = await MemoryVectorStore.fromDocuments(
  [
    new Document({
      pageContent:
        "退款政策：购买后 30 天内可申请无条件退款。超过 30 天需要提供商品质量问题的证明。",
    }),
    new Document({
      pageContent:
        "配送说明：标准配送 3-5 个工作日，加急配送 1-2 个工作日。偏远地区可能延迟 2-3 天。",
    }),
    new Document({
      pageContent: "会员等级：消费满 1000 元升银卡，满 5000 元升金卡，满 20000 元升钻石卡。",
    }),
    new Document({
      pageContent: "客服工作时间：周一至周五 9:00-18:00，周末及节假日 10:00-16:00。",
    }),
  ],
  embeddings,
);

const retriever = vectorStore.asRetriever({ k: 2 });

// Prompt：把检索到的内容放进 system 消息
// !mark(1:7)
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个客服助手。请根据以下参考资料回答用户的问题。
如果参考资料里没有相关信息，诚实地说"这个问题我需要转接人工客服"。
不要编造信息。

参考资料：
{context}`,
  ],
  ["human", "{question}"],
]);

// 把 Document 数组格式化成纯文本
const formatDocs = RunnableLambda.from((docs: Document[]) => {
  return docs.map((doc, i) => `[${i + 1}] ${doc.pageContent}`).join("\n\n");
});

// 组装 RAG 链
// !mark(1:9)
const ragChain = RunnablePassthrough.assign({
  context: RunnableLambda.from((input: any) => input.question)
    .pipe(retriever)
    .pipe(formatDocs),
})
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser());

// 测试
const answer = await ragChain.invoke({
  question: "买了东西多久内可以退款？",
});
console.log(answer);
// → "根据退款政策，购买后 30 天内可以申请无条件退款。
//    如果超过 30 天，需要提供商品质量问题的证明。"
