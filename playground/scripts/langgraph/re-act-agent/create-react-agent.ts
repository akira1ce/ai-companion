import { MemorySaver } from "@langchain/langgraph";
import { createAgent } from "langchain";
import { deepseekModel } from "../../models";
import { calculate, getCurrentTime, getWeather } from "./tools";

// 一行搞定：模型 + 工具 + Checkpointer
// createReactAgent 被废弃了，使用 createAgent 代替
const agent = createAgent({
	model: deepseekModel,
	tools: [getWeather, calculate, getCurrentTime],
	checkpointer: new MemorySaver(),
});

// 用法和手动构建的完全一样
const result = await agent.invoke(
	{ messages: [{ role: "user", content: "北京天气怎么样？顺便算下 365 * 24" }] },
	{ configurable: { thread_id: "quick-001" } }
);

console.log(result.messages.at(-1)?.content);

console.log("--------------------------------");

const stream = await agent.stream(
	{ messages: [{ role: "user", content: "北京天气怎么样？顺便算下 12 * 15" }] },
	{
		configurable: { thread_id: "stream-005" },
		streamMode: "updates",
	}
);

for await (const chunk of stream) {
	if ("model_request" in chunk) {
		// model_request 这一步结束后，最后一条消息通常就是模型刚刚产出的那条。
		const lastMsg = chunk.model_request.messages.at(-1);

		if ((lastMsg as any)?.tool_calls?.length) {
			// 如果模型产出的是 tool_calls，说明它这一步不是在回答用户，
			// 而是在决定下一步要调用哪些工具。
			const toolNames = (lastMsg as any).tool_calls.map((tc: any) => tc.name).join(", ");
			console.log(`🔧 正在调用: ${toolNames}`);
		} else if (lastMsg?.content) {
			// 如果没有 tool_calls，而是直接有文本内容，
			// 这通常就是模型已经开始生成最终回复了。
			console.log(`💬 ${lastMsg.content}`);
		}
	}

	if ("tools" in chunk) {
		// 工具节点结束后，可以把工具结果先展示出来，
		// 不用等模型把整轮回复全组织完。
		for (const msg of chunk.tools.messages) {
			console.log(`📋 工具结果: ${msg.content}`);
		}
	}
}
