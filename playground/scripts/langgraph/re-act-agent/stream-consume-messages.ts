import { graph } from "./agent-core";

const stream = await graph.stream(
	{ messages: [{ role: "user", content: "北京天气怎么样？" }] },
	{
		configurable: { thread_id: "stream-006" },
		streamMode: "messages",
	}
);

for await (const [messageChunk, meta] of stream) {
	// 这里只消费模型节点吐出来的文本流。
	// 如果图里还有别的节点也产生消息，可以按 meta 再分流处理。
	if (meta.langgraph_node !== "callModel") continue;

	const token = messageChunk.content;
	if (typeof token === "string" && token) {
		// 每收到一个文本块就往前推一次，聊天界面里就会看到“边生成边显示”。
		process.stdout.write(token);
	}
}

console.log();
