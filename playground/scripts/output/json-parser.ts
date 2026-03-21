import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { deepseekModel } from "../models";

const parser = new JsonOutputParser();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    ["你负责做情绪识别。", "只返回 JSON，不要补充解释。", parser.getFormatInstructions()].join(
      "\n",
    ),
  ],
  ["human", "{input}"],
]);

const chain = prompt.pipe(deepseekModel).pipe(parser);

const result = await chain.invoke({
  input: "今天一直在改 bug，越改越乱，我有点烦。",
});

console.log(result);
