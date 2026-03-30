import { createAgent, summarizationMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { deepseekModel } from "../models";
const checkpointer = new MemorySaver();

const agent = createAgent({
  model: deepseekModel,
  tools: [],
  middleware: [
    summarizationMiddleware({
      model: deepseekModel,
      trigger: { tokens: 4000 },
      keep: { messages: 20 },
    }),
  ],
  checkpointer,
});

const config = {
  configurable: {
    thread_id: "companion-user-001",
  },
};

await agent.invoke({ messages: "我今天加班到快 11 点" }, config);
await agent.invoke({ messages: "还是上次那个需求，改了好几版了" }, config);
await agent.invoke({ messages: "我在想要不要直接找产品聊一次" }, config);

const result = await agent.invoke({ messages: "你还记得我刚才在烦什么吗？" }, config);

console.log(result.messages.at(-1)?.content);
