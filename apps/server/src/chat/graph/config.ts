import { Annotation } from "@langchain/langgraph";
import type { ChatDeps } from "../runtime/create-chat-deps.js";

export const ChatGraphConfig = Annotation.Root({
	deps: Annotation<ChatDeps>,
});
