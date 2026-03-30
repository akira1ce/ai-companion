// import type { VectorizeIndex, Fetcher } from '@cloudflare/workers-types'

type VectorizeIndex = any;
type Fetcher = any;

import { CloudflareVectorizeStore, CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare";

interface Env {
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Fetcher;
}

export async function queryDocs(env: Env) {
  const embeddings = new CloudflareWorkersAIEmbeddings({
    binding: env.AI,
    model: "@cf/baai/bge-small-en-v1.5",
  });

  const vectorStore = new CloudflareVectorizeStore(embeddings, {
    index: env.VECTORIZE_INDEX,
  });

  await vectorStore.addDocuments([
    { pageContent: "useEffect 用于处理副作用", metadata: { topic: "hooks" } },
    { pageContent: "Zustand 是一个轻量状态管理库", metadata: { topic: "state" } },
  ]);

  return await vectorStore.similaritySearch("React 副作用怎么处理", 2);
}
