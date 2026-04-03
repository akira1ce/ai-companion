import { END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import type { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { deepseekModel } from "../../models";
import { tools } from "./tools";

// 状态：只需要一个消息列表
// 用户输入、模型回复、工具调用请求、工具执行结果——全部是消息
const State = new StateSchema({
	messages: MessagesValue,
});

// 模型：绑定工具后，模型在推理时会自动考虑是否调用它们
const model = deepseekModel.bindTools(tools);

// 节点 1：调用模型
// 把所有消息（含历史对话和工具结果）发给模型，拿回回复
const callModel: GraphNode<typeof State> = async (state) => {
	const response = await model.invoke(state.messages);
	return { messages: [response] };
};

// 节点 2：执行工具
// 从模型回复中取出工具调用请求，执行后把结果放回消息列表
const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

const callTools: GraphNode<typeof State> = async (state) => {
	const lastMsg = state.messages.at(-1)! as any;
	const toolCalls = lastMsg.tool_calls ?? [];

	// 多个工具调用并行执行
	const results = await Promise.all(
		toolCalls.map(async (tc: any) => {
			try {
				const result = await (toolsByName[tc.name] as any).invoke(tc.args);
				return { role: "tool" as const, content: result, tool_call_id: tc.id };
			} catch (err) {
				// 工具失败时把错误信息返回给模型，让它自己决定怎么应对
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

// 路由：模型回复里有工具调用就继续循环，没有就结束
const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
	const lastMsg = state.messages.at(-1)! as any;
	if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
		return "callTools";
	}
	return END;
};

// 组装图
export const graph = new StateGraph(State)
	.addNode("callModel", callModel)
	.addNode("callTools", callTools)
	.addEdge(START, "callModel") // 入口
	.addConditionalEdges("callModel", shouldContinue, ["callTools", END]) // 条件分支
	.addEdge("callTools", "callModel") // 循环回路
	.compile({
		checkpointer: new MemorySaver(), // 支持多轮对话
	});
