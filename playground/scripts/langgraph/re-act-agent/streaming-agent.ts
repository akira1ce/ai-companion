import * as z from "zod";
import { tool } from "@langchain/core/tools";
import { END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import type { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { deepseekModel } from "../../models";

const getWeather = tool(
	async ({ city }) => {
		const data: Record<string, string> = {
			北京: "晴，12-25°C",
			上海: "小雨，17-22°C",
			深圳: "多云，26-30°C",
		};
		return data[city] ?? `暂无 ${city} 的天气数据`;
	},
	{
		name: "get_weather",
		description: "查询指定城市的天气",
		schema: z.object({ city: z.string().describe("城市名称") }),
	}
);

const calculate = tool(
	async ({ expression }) => {
		try {
			const result = new Function(`return ${expression}`)();
			return `${expression} = ${result}`;
		} catch {
			return `无法计算: ${expression}`;
		}
	},
	{
		name: "calculate",
		description: "计算数学表达式",
		schema: z.object({ expression: z.string().describe("数学表达式") }),
	}
);

const tools = [getWeather, calculate];
const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

// 模型先绑定工具。后面模型节点里只负责看消息、决定是回答还是调工具。
const model = deepseekModel.bindTools(tools);

const State = new StateSchema({
	messages: MessagesValue,
});

const callModel: GraphNode<typeof State> = async (state) => {
	// 把当前累积的消息都交给模型，让它决定下一步是直接回答还是继续调工具。
	const response = await model.invoke(state.messages);
	return { messages: [response] };
};

const callTools: GraphNode<typeof State> = async (state) => {
	// 工具节点只看最后一条模型消息里的 tool_calls。
	const lastMsg = state.messages.at(-1)! as any;
	const toolCalls = lastMsg.tool_calls ?? [];

	const results = await Promise.all(
		toolCalls.map(async (tc: any) => {
			try {
				// 按工具名取出真正的工具，再把参数传进去执行。
				const result = await (toolsByName[tc.name] as any).invoke(tc.args);
				return { role: "tool" as const, content: result, tool_call_id: tc.id };
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				return {
					role: "tool" as const,
					content: `工具执行失败: ${errorMsg}`,
					tool_call_id: tc.id,
				};
			}
		})
	);

	return { messages: results };
};

const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
	// 如果最后一条模型消息里还带着 tool_calls，就继续走工具节点；
	// 否则说明模型已经准备好给最终回复，可以结束整张图。
	const lastMsg = state.messages.at(-1)!;
	if ((lastMsg as any).tool_calls && (lastMsg as any).tool_calls.length > 0) {
		return "callTools";
	}
	return END;
};

const graph = new StateGraph(State)
	.addNode("callModel", callModel)
	.addNode("callTools", callTools)
	.addEdge(START, "callModel")
	.addConditionalEdges("callModel", shouldContinue, ["callTools", END])
	.addEdge("callTools", "callModel")
	.compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "streaming-demo" } };

console.log("=== updates ===");
const updatesStream = await graph.stream(
	{ messages: [{ role: "user", content: "北京天气怎么样？" }] },
	{
		...config,
		streamMode: "updates",
	}
);

for await (const chunk of updatesStream) {
	// updates 最适合先看图到底是怎么往前推进的。
	console.log(chunk);
}

console.log("\n=== messages ===");
const messagesStream = await graph.stream(
	{ messages: [{ role: "user", content: "那上海呢？" }] },
	{
		...config,
		streamMode: "messages",
	}
);

for await (const [messageChunk, meta] of messagesStream) {
	// 这里只展示模型节点的文本流，不把别的节点混进来。
	if (meta.langgraph_node !== "callModel") continue;

	const token = messageChunk.content;
	if (typeof token === "string" && token) {
		process.stdout.write(token);
	}
}

console.log("\n\n=== streamEvents ===");
const eventStream = graph.streamEvents(
	{ messages: [{ role: "user", content: "顺便算一下 12 * 15" }] },
	{
		version: "v2",
		configurable: { thread_id: "streaming-demo" },
	}
);

for await (const event of eventStream) {
	// streamEvents 更适合看一条运行事件到底是在什么时候发生的。
	if (event.event === "on_tool_start") {
		console.log(`\n🔧 ${event.name} 开始执行`);
	}

	if (event.event === "on_tool_end") {
		console.log(`✅ ${event.name} 执行完成`);
	}
}
