import { graph } from "./agent-core";

const config = { configurable: { thread_id: "test-002" } };

// 第一轮
await graph.invoke({ messages: [{ role: "user", content: "现在几点了？" }] }, config);

// 第二轮：同一个 thread_id，上下文自动累积
const r2 = await graph.invoke({ messages: [{ role: "user", content: "帮我算一下 365 * 24" }] }, config);
console.log(r2.messages.at(-1)?.content);
// → 365 × 24 = 8760，一年有 8760 个小时。

// 第三轮：Agent 记得之前的对话
const r3 = await graph.invoke({ messages: [{ role: "user", content: "前面我问了你什么？" }] }, config);
console.log(r3.messages.at(-1)?.content);
// → 你先问了现在几点，然后问一年有多少小时。
