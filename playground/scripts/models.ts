import { ChatOpenAI } from "@langchain/openai";

import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env.local", import.meta.url) });

export const deepseekModel = new ChatOpenAI({
  model: process.env.DEEPSEEK_MODEL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
});
