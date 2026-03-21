import { RunnableLambda } from "@langchain/core/runnables";

const detectUrgency = new RunnableLambda({
  func: ({ input }: { input: string }) => {
    const urgentWords = ["崩溃", "来不及", "线上", "故障"];
    const isUrgent = urgentWords.some((word) => input.includes(word));

    return {
      input,
      priority: isUrgent ? "high" : "normal",
    };
  },
});

const result = await detectUrgency.invoke({
  input: "线上故障刚修完，我现在有点乱。",
});

console.log(result);
