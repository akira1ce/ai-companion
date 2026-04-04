import type { EmotionEvent } from "@ai-companion/types";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const VALID_EVENTS: EmotionEvent[] = [
	"praise",
	"gift",
	"ignored",
	"argument",
	"apology",
	"confession",
	"intimate",
	"mention_other",
	"comfort",
	"neglect",
];

interface ClassifierResult {
	event: EmotionEvent | null;
	confidence: number;
}

const parser = new JsonOutputParser<ClassifierResult>();

const systemPrompt = [
	"你是一个情绪事件分类器。",
	"",
	"任务：",
	`判断用户输入是否触发以下事件之一（只能选一个或 null）：${VALID_EVENTS.join(", ")}`,
	"",
	"事件定义：",
	"praise: 夸奖、赞美 AI",
	"gift: 送礼物、惊喜",
	"ignored: 长时间不回复、冷落",
	"argument: 吵架、激烈争论",
	"apology: 道歉、认错",
	"confession: 表白、说喜欢",
	"intimate: 亲密互动（撒娇、牵手等）",
	"mention_other: 提到其他异性",
	"comfort: 安慰、鼓励 AI",
	"neglect: 敷衍、不在意",
	"",
	"规则：",
	"- 只返回最主要的一个事件",
	"- 不确定时返回 event = null",
	"- confidence ∈ [0,1]",
	"",
	"输出格式：",
	`{{"event": "praise", "confidence": 0.0}}`,
].join("\n");

const prompt = ChatPromptTemplate.fromMessages([
	["system", systemPrompt],
	["human", "{input}"],
]);

/** 分类情绪事件 */
export async function classifyEmotionEvent(
	model: BaseChatModel,
	input: string,
	callbacks: BaseCallbackHandler[] = []
): Promise<EmotionEvent | null> {
	const chain = prompt.pipe(model).pipe(new JsonOutputParser<ClassifierResult>());
	try {
		const result = await chain.invoke({ input }, { callbacks, runName: "emotion-classifier" });
		if (result.confidence >= 0.6 && result.event && VALID_EVENTS.includes(result.event)) {
			return result.event;
		}
	} catch {
		// classifier failure is non-fatal
	}
	return null;
}
