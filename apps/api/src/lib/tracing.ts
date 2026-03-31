import { Client } from 'langsmith';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import type { Env } from '../index.js';

export function createTracer(env: Env): LangChainTracer | undefined {
  if (!env.LANGSMITH_API_KEY) return undefined;

  const client = new Client({
    apiKey: env.LANGSMITH_API_KEY,
    apiUrl: 'https://api.smith.langchain.com',
  });

  return new LangChainTracer({
    client,
    projectName: env.LANGSMITH_PROJECT || 'ai-companion',
  });
}
