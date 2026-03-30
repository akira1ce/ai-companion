import { tool } from "langchain";
import { z } from "zod";

export const createReminder = tool(
  async ({ content, time }) => {
    return {
      ok: true,
      message: `已创建提醒：${time} - ${content}`,
    };
  },
  {
    name: "create_reminder",
    description: "创建一个提醒事项",
    schema: z.object({
      content: z.string().describe("提醒内容"),
      time: z.string().describe("提醒时间，例如 明天早上 8 点"),
    }),
  },
);
