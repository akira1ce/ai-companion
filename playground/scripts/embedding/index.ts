import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// Step 1: 加载
const loader = new PDFLoader("./data/react-handbook.pdf");
const rawDocs = await loader.load();
console.log(`加载了 ${rawDocs.length} 页`);

// Step 2: 分割
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});
const chunks = await splitter.splitDocuments(rawDocs);
console.log(`分割成 ${chunks.length} 个块`);

// Step 3: Embedding + 存入向量数据库
// !mark(1:5)
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
console.log("向量索引建好了");

// Step 4: 检索
// !mark(1:2)
const retriever = vectorStore.asRetriever({ k: 3 });
const results = await retriever.invoke("useEffect 清理函数");

results.forEach((doc, i) => {
  console.log(`\n--- 结果 ${i + 1} ---`);
  console.log(doc.pageContent.slice(0, 200));
  console.log("来源:", doc.metadata.source, "页码:", doc.metadata.loc?.pageNumber);
});
