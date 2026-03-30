import { tool } from "langchain";
import { z } from "zod";

export const getWeather = tool(
  async ({ city }) => {
    const fakeWeatherMap: Record<string, string> = {
      上海: "小雨，18 度",
      北京: "晴天，24 度",
      深圳: "多云，28 度",
    };

    return fakeWeatherMap[city] ?? `${city}：暂无天气数据`;
  },
  {
    name: "get_weather",
    description: "查询某个城市的天气情况",
    schema: z.object({
      city: z.string().describe("要查询天气的城市名"),
    }),
  },
);
