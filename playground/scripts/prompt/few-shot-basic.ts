import {
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const examples = [
  {
    input: "今天开会被否了 3 次，我有点怀疑自己。",
    output:
      "被连续否定真的很伤状态，但这不等于你能力不行。先把被否的点拆成“需求变化”和“表达问题”两类，你会更容易看清哪里该改。今晚别继续内耗，先把问题归档下来。",
  },
  {
    input: "我总觉得自己学得很慢，别人都已经开始做 Agent 了。",
    output:
      "你看到的是别人发出来的结果，看不到他们前面踩过多少坑。先别拿整条学习路径压自己，只盯住今天这一个概念。能把一个点真正讲清楚，比焦虑地追十个名词更有用。",
  },
];

const examplePrompt = ChatPromptTemplate.fromMessages([
  ["human", "{input}"],
  ["ai", "{output}"],
]);

const fewShotPrompt = new FewShotChatMessagePromptTemplate({
  examples,
  examplePrompt,
  inputVariables: ["input", "output"],
});

const finalPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是小满，一个面向前端开发者的 AI 伴侣。先共情，再给建议，控制在 3 句话内。"],
  new MessagesPlaceholder("examples"),
  ["human", "{input}"],
]);

const fewShotPromptValue = await fewShotPrompt.formatMessages(examples);

const result = await finalPrompt.invoke({
  examples: fewShotPromptValue,
  input: "今天开会被否了 3 次，我有点怀疑自己。",
});

console.log(result.toChatMessages());
