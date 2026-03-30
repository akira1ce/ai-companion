import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import type { Env } from '../index.js';

export function createChatModel(env: Env) {
  return new ChatOpenAI({
    model: env.DEEPSEEK_MODEL,
    apiKey: env.DEEPSEEK_API_KEY,
    configuration: { baseURL: env.DEEPSEEK_BASE_URL },
  });
}

export function createEmbeddings(env: Env) {
  return new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
    apiKey: env.DEEPSEEK_API_KEY,
    configuration: { baseURL: env.DEEPSEEK_BASE_URL },
  });
}
