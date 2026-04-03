import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatGraphConfig } from "./config.js";
import { buildPromptNode } from "./nodes/build-prompt.js";
import { buildResponseNode } from "./nodes/build-response.js";
import { classifyEmotionNode } from "./nodes/classify-emotion.js";
import { generateReplyNode } from "./nodes/generate-reply.js";
import { loadContextNode } from "./nodes/load-context.js";
import { loadSessionNode } from "./nodes/load-session.js";
import { persistTurnNode } from "./nodes/persist-turn.js";
import { retrieveMemoryNode } from "./nodes/retrieve-memory.js";
import { scheduleMemoryExtractionNode } from "./nodes/schedule-memory-extraction.js";
import { skipExtractMemoryNode } from "./nodes/skip-extract-memory.js";
import { skipRetrieveMemoryNode } from "./nodes/skip-retrieve-memory.js";
import { updateEmotionNode } from "./nodes/update-emotion.js";
import { shouldExtractMemory } from "./routers/should-extract-memory.js";
import { shouldRetrieveMemory } from "./routers/should-retrieve-memory.js";
import { ChatGraphState } from "./state.js";

export function createChatGraph() {
	return new StateGraph(ChatGraphState, ChatGraphConfig)
		.addNode("loadContext", loadContextNode)
		.addNode("retrieveMemory", retrieveMemoryNode)
		.addNode("skipRetrieveMemory", skipRetrieveMemoryNode)
		.addNode("classifyEmotion", classifyEmotionNode)
		.addNode("updateEmotion", updateEmotionNode)
		.addNode("loadSession", loadSessionNode)
		.addNode("buildPrompt", buildPromptNode)
		.addNode("generateReply", generateReplyNode)
		.addNode("persistTurn", persistTurnNode)
		.addNode("scheduleMemoryExtraction", scheduleMemoryExtractionNode)
		.addNode("skipExtractMemory", skipExtractMemoryNode)
		.addNode("buildResponse", buildResponseNode)
		.addEdge(START, "loadContext")
		.addConditionalEdges("loadContext", shouldRetrieveMemory, {
			retrieve: "retrieveMemory",
			skip: "skipRetrieveMemory",
		})
		.addEdge("retrieveMemory", "classifyEmotion")
		.addEdge("skipRetrieveMemory", "classifyEmotion")
		.addEdge("classifyEmotion", "updateEmotion")
		.addEdge("updateEmotion", "loadSession")
		.addEdge("loadSession", "buildPrompt")
		.addEdge("buildPrompt", "generateReply")
		.addEdge("generateReply", "persistTurn")
		.addConditionalEdges("persistTurn", shouldExtractMemory, {
			extract: "scheduleMemoryExtraction",
			skip: "skipExtractMemory",
		})
		.addEdge("scheduleMemoryExtraction", "buildResponse")
		.addEdge("skipExtractMemory", "buildResponse")
		.addEdge("buildResponse", END)
		.compile();
}
