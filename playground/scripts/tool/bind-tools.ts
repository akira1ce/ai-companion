import { getWeather } from "./get-weather-tool";
import { createReminder } from "./create-reminder-tool";
import { deepseekModel } from "../models";

const model = deepseekModel;

const modelWithTools = model.bindTools([getWeather, createReminder]);

const result = await modelWithTools.invoke([
  ["system", "你是一个天气助手，回答要清晰、简洁。"],
  ["human", "明天上海的天气怎么样？"],
]);

console.log(result.content);
console.log(result);
