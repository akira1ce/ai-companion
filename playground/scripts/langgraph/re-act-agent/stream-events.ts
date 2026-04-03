import { graph } from "./agent-core";

const eventStream = graph.streamEvents(
	{ messages: [{ role: "user", content: "北京天气怎么样？" }] },
	{
		version: "v2",
		configurable: { thread_id: "events-001" },
	}
);

for await (const event of eventStream) {
	if (event.event === "on_tool_start") {
		// 工具真正开始执行时，这里会先收到一条事件。
		console.log(`🔧 开始调用 ${event.name}`);
	}

	if (event.event === "on_tool_end") {
		// 工具结束后，再收到一条结束事件。
		console.log(`✅ ${event.name} 已完成`);
	}

	if (event.event === "on_chat_model_stream") {
		// 如果你想要最细的模型流式事件，可以在这里接 token。
		const token = event.data.chunk?.content;
		if (typeof token === "string" && token) {
			process.stdout.write(token);
		}
	}
}

console.log();
