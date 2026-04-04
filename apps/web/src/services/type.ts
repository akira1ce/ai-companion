export interface HistoryMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}
