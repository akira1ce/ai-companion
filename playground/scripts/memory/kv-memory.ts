import { BufferMemory } from "@langchain/classic/memory";
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import type { BaseMessage } from "@langchain/core/messages";
import {
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";

declare const env: { KEEPZML_KV: any };

export class CloudflareKVChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["langchain", "cloudflare", "kv_chat_message_history"];

  constructor(
    // 这一段会话的唯一标识，用来拼接 KV key
    private sessionId: string,
    // Workers 运行时绑定进来的 KV 实例
    private kv: any,
  ) {
    super();
  }

  async getMessages(): Promise<BaseMessage[]> {
    // 1. 从 KV 里读出原始 JSON
    const stored = await this.kv.get(`chat:${this.sessionId}`, "json");
    // 2. 把存储格式还原回 LangChain 认识的 BaseMessage[]
    return stored ? mapStoredMessagesToChatMessages(stored as any[]) : [];
  }

  async addMessage(message: BaseMessage) {
    // 1. 先把旧消息读出来
    const messages = await this.getMessages();
    // 2. 追加当前这条新消息
    const next = [...messages, message];
    // 3. 转成可序列化格式，再写回 KV
    await this.kv.put(
      `chat:${this.sessionId}`,
      JSON.stringify(mapChatMessagesToStoredMessages(next)),
    );
  }

  async clear() {
    await this.kv.delete(`chat:${this.sessionId}`);
  }
}

const memory = new BufferMemory({
  returnMessages: true,
  // 这里把自定义的 KV 聊天历史适配器交给 BufferMemory
  chatHistory: new CloudflareKVChatMessageHistory("user-123-session-1", env.KEEPZML_KV),
});
