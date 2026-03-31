// Emotion types
export type EmotionState = "calm" | "happy" | "angry" | "sad" | "shy" | "jealous";

export type EmotionEvent =
	| "praise"
	| "gift"
	| "ignored"
	| "argument"
	| "apology"
	| "confession"
	| "intimate"
	| "mention_other"
	| "comfort"
	| "neglect";

export interface EmotionContext {
	state: EmotionState;
	intensity: number; // 0-100
	intimacy: number; // 0-100
	updatedAt: number; // unix ms
	cooldownUntil?: number; // unix ms, debounce guard
}

// Memory types
export type MemoryType =
	| "profile" // user profile facts
	| "event" // D1 + Vectorize: life events
	| "fact" // D1: explicit facts
	| "summary" // D1: time-range summaries
	| "keyword"; // full-text index

export interface MemoryDocument {
	id: string;
	type: MemoryType;
	content: string;
	metadata: Record<string, unknown>;
	createdAt: number;
	score?: number; // retrieval relevance
}

export interface RetrievalQuery {
	text: string;
	sessionId: string;
	topK?: number;
}

// Prompt types
export interface PromptContext {
	emotion: EmotionContext;
	memories: MemoryDocument[];
	userProfile: UserProfile;
}

export interface UserProfile {
	id: string;
	name: string;
	occupation?: string;
	interests?: string[];
	recentEvents?: string[];
}

// Chat types
export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

export interface GetMessagesRequest {
	sessionId: string;
	limit: number;
}

export interface ChatRequest {
	userId: string;
	message: string;
	sessionId: string;
}

export interface ChatResponse {
	reply: string;
	emotion: EmotionContext;
	sessionId: string;
}

export interface GetEmotionRequest {
	sessionId: string;
}

// Session types
export interface Session {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
}
