import { Session } from "@ai-companion/types";
import { create } from "zustand";
import { NEW_SESSION_ID } from "@/constants";
import { apiGetSessions } from "@/services";

export interface ConversationStore {
	current: string | null;
	sessions: Session[];
}

const initialState: ConversationStore = {
	current: null,
	sessions: [],
};

export const useConversation = create<ConversationStore>(() => initialState);

const set = useConversation.setState;

export const conversationActions = {
	setCurrent: (current: ConversationStore["current"]) => set({ current }),
	setSessions: (sessions: ConversationStore["sessions"]) => set({ sessions }),
	loadSessions: async (userId: string) => {
		const res = await apiGetSessions({ userId });
		set({ sessions: res.sessions });
	},
};
