import { RunnablePassthrough } from "@langchain/core/runnables";

const normalizeInput = RunnablePassthrough.assign({
  trimmedInput: ({ input }: { input: string }) => input.trim(),
  inputLength: ({ input }: { input: string }) => input.trim().length,
});

const result = await normalizeInput.invoke({
  input: "  我今天一直在改 bug。  ",
});

console.log(result);
