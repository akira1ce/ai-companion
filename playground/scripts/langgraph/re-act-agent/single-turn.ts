import { graph } from "./agent-core";

const config = { configurable: { thread_id: "test-001" } };

const result = await graph.invoke(
	{ messages: [{ role: "user", content: "北京和上海今天天气怎么样？顺便算下 365 * 24" }] },
	config
);

for (const msg of result.messages) {
	const type = msg.getType();
	if (type === "human") {
		console.log(`[用户] ${msg.content}`);
	} else if (type === "ai" && (msg as any).tool_calls?.length) {
		console.log(
			`[模型决策] 调用工具: ${(msg as any).tool_calls.map((tc: any) => `${tc.name}(${JSON.stringify(tc.args)})`).join(", ")}`
		);
	} else if (type === "tool") {
		console.log(`[工具结果] ${msg.content}`);
	} else {
		console.log(`[模型回复] ${msg.content}`);
	}
}
