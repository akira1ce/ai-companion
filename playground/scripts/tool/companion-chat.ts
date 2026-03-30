import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getWeather, createReminder, querySchedule } from "./companion-tools";
import { deepseekModel } from "../models";

const tools = [getWeather, createReminder, querySchedule];
const toolMap: any = new Map(tools.map((t) => [t.name, t]));

const model = deepseekModel;
const modelWithTools = model.bindTools(tools);

// 维护对话历史
const messages: BaseMessage[] = [
  new SystemMessage(`你是用户的 AI 伴侣。
当用户的请求涉及查天气、查日程、建提醒时，使用对应的工具。
如果用户只是在聊天，正常回复即可，不要强行调用工具。`),
];

export async function chat(userInput: string) {
  messages.push(new HumanMessage(userInput));

  // 让模型决定：是直接回复，还是先调工具
  let aiMessage = await modelWithTools.invoke(messages);
  messages.push(aiMessage);

  // 如果模型想调工具，就执行工具，再让模型继续
  while (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
    for (const toolCall of aiMessage.tool_calls) {
      const selectedTool = toolMap.get(toolCall.name);
      if (!selectedTool) continue;

      const toolResult = await selectedTool.invoke(toolCall);
      messages.push(toolResult);
    }

    // 把工具结果交回模型，让它决定下一步
    aiMessage = await modelWithTools.invoke(messages);
    messages.push(aiMessage);
  }

  return aiMessage.text;
}

console.log(await chat("明天上海天气怎么样？"));
// 模型调用 get_weather({ city: '上海' })
// → "明天上海小雨，17-22 度，出门记得带把伞。"

console.log(await chat("那帮我设个提醒吧，明早出门前提醒我带伞"));
// 模型调用 create_reminder({ content: '带伞', time: '明天早上' })
// → "好的，已经帮你设好了，明天早上会提醒你带伞。"

console.log(await chat("对了明天有什么安排吗"));
// 模型调用 query_schedule({ date: '明天' })
// → "明天有两个安排：10 点产品评审会，下午 2 点和小李 1v1。"

console.log(await chat("最近有点累"));
// 模型判断不需要调工具，直接回复
// → "最近是不是事情比较多？今天早点休息吧..."
