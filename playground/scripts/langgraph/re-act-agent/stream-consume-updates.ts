import { graph } from "./agent-core";

const stream = await graph.stream(
	{ messages: [{ role: "user", content: "北京天气怎么样？顺便算下 12 * 15" }] },
	{
		configurable: { thread_id: "stream-005" },
		streamMode: "updates",
	}
);

for await (const chunk of stream) {
	if ("callModel" in chunk) {
		// callModel 这一步结束后，最后一条消息通常就是模型刚刚产出的那条。
		const lastMsg = (chunk.callModel as any).messages.at(-1);

		if (lastMsg?.tool_calls?.length) {
			// 如果模型产出的是 tool_calls，说明它这一步不是在回答用户，
			// 而是在决定下一步要调用哪些工具。
			const toolNames = lastMsg.tool_calls.map((tc: any) => tc.name).join(", ");
			console.log(`🔧 正在调用: ${toolNames}`);
		} else if (lastMsg?.content) {
			// 如果没有 tool_calls，而是直接有文本内容，
			// 这通常就是模型已经开始生成最终回复了。
			console.log(`💬 ${lastMsg.content}`);
		}
	}

	if ("callTools" in chunk) {
		// 工具节点结束后，可以把工具结果先展示出来，
		// 不用等模型把整轮回复全组织完。
		for (const msg of (chunk.callTools as any).messages) {
			console.log(`📋 工具结果: ${msg.content}`);
		}
	}
}
