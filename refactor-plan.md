可以，下面我直接给你一版**贴当前仓库结构**的 LangGraph 重构草图，尽量按你现在已有的包和 Worker 环境来设计，不搞太虚。

---

# 目标

把现在 `apps/api/src/routes/chat.ts:51` 这条“大一统 handler”改成：

- `route` 很薄
- `graph` 负责编排
- `service` 负责业务能力
- `repository/runtime` 负责存储和外部依赖

你已经有这些现成能力：

- emotion FSM：`@ai-companion/emotion`
- memory retrieval / writer：`@ai-companion/memory`
- prompt assembly：`@ai-companion/prompt`
- model factory：`apps/api/src/lib/model.ts:4`
- classifier：`apps/api/src/lib/emotion-classifier.ts:58`
- extractor：`apps/api/src/lib/memory-extractor.ts:40`

所以这次重构重点不是“重写能力”，而是**把 orchestration 从 route 挪到 graph**。

---

# 一、建议目录结构

基于你当前 `apps/api/src`，我建议这样落：

```txt
apps/api/src/
  index.ts

  routes/
    chat.ts
    emotion.ts
    messages.ts

  chat/
    graph/
      state.ts
      graph.ts
      config.ts
      nodes/
        load-context.ts
        retrieve-memory.ts
        classify-emotion.ts
        update-emotion.ts
        load-session.ts
        build-prompt.ts
        generate-reply.ts
        persist-turn.ts
        schedule-memory-extraction.ts
        build-response.ts
      routers/
        should-retrieve-memory.ts
        should-extract-memory.ts

    services/
      emotion-service.ts
      memory-service.ts
      prompt-service.ts
      session-service.ts
      chat-service.ts

    repositories/
      emotion-repository.ts
      profile-repository.ts
      message-repository.ts

    runtime/
      create-chat-deps.ts

  lib/
    emotion-classifier.ts
    memory-extractor.ts
    model.ts
    tracing.ts
```

这里我没有强行把你现有 `lib/*` 马上全部搬走，因为第一阶段可以**先复用**。

---

# 二、分层职责

---

## 1) Route 层

文件：

- `apps/api/src/routes/chat.ts`

职责只保留：

- 读请求
- 参数校验
- 创建 graph deps
- invoke graph
- return response

最终形态类似：

```ts
export async function handleChat(c: Context<{ Bindings: Env }>) {
	const body = await c.req.json<ChatRequest>();

	if (!body.userId || !body.message || !body.sessionId) {
		return c.json({ error: "userId, message, sessionId are required" }, 400);
	}

	const graph = createChatGraph();
	const deps = createChatDeps(c.env, c.executionCtx);

	const result = await graph.invoke(
		{
			userId: body.userId,
			sessionId: body.sessionId,
			message: body.message,
		},
		{
			configurable: { deps },
		}
	);

	return c.json(result.response);
}
```

这也符合 LangGraph 当前 TypeScript 用法：node 里通过 `config.configurable` 取运行时依赖。

---

## 2) Graph 层

文件：

- `apps/api/src/chat/graph/state.ts`
- `apps/api/src/chat/graph/graph.ts`
- `apps/api/src/chat/graph/nodes/*`
- `apps/api/src/chat/graph/routers/*`

职责：

- 定义 graph state
- 定义 node
- 定义 edge / conditional edge
- compile graph

这层**不写具体 KV/SQL/Vectorize 细节**。

---

## 3) Services 层

文件：

- `apps/api/src/chat/services/*`

职责：

- 组合已有 domain 包能力
- 暴露给 graph node 调用的稳定接口

比如：

- `EmotionService`：load + decay / classify / transition / save
- `MemoryService`：retrieve / extract / write
- `SessionService`：read history / persist recent context / append messages
- `PromptService`：assemble prompt
- `ChatService`：invoke model

---

## 4) Repository / Runtime 层

### repository

职责：

- 持久化边界
- 封装 KV/D1 key 和 SQL

### runtime

职责：

- 创建 model / embeddings / retriever / writer / tracer
- 组装 services
- 作为 graph deps 注入

---

# 三、推荐 state 设计

LangGraph 里最重要的是 **state 不要变成垃圾场**。

---

## `apps/api/src/chat/graph/state.ts`

推荐这样分：

```ts
import type { ChatResponse, EmotionContext, EmotionEvent, MemoryDocument, UserProfile } from "@ai-companion/types";
import { Annotation } from "@langchain/langgraph";

export const ChatGraphState = Annotation.Root({
	userId: Annotation<string>,
	sessionId: Annotation<string>,
	message: Annotation<string>,

	emotion: Annotation<EmotionContext | undefined>,
	userProfile: Annotation<UserProfile | undefined>,
	emotionEvent: Annotation<EmotionEvent | null | undefined>,
	memories: Annotation<MemoryDocument[]>({
		default: () => [],
	}),
	sessionMessages: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
		default: () => [],
	}),
	systemPrompt: Annotation<string | undefined>,
	reply: Annotation<string | undefined>,
	now: Annotation<number | undefined>,

	shouldRetrieveMemory: Annotation<boolean>({
		default: () => true,
	}),
	shouldExtractMemory: Annotation<boolean>({
		default: () => true,
	}),

	response: Annotation<ChatResponse | undefined>,
	error: Annotation<string | undefined>,
});
```

---

## 为什么这样拆

### 输入态

- `userId`
- `sessionId`
- `message`

### 工作态

- `emotion`
- `userProfile`
- `emotionEvent`
- `memories`
- `sessionMessages`
- `systemPrompt`
- `reply`
- `now`

### 控制态

- `shouldRetrieveMemory`
- `shouldExtractMemory`
- `error`

### 输出态

- `response`

---

## 不要放进 state 的东西

不要放：

- `env`
- `db`
- `kv`
- `vectorize`
- `model`
- `retriever`
- `writer`
- `tracer`

这些应该放在 `config.configurable.deps` 里。

---

# 四、deps 注入方式

LangGraph JS 文档当前推荐模式可以这样用：`StateGraph(StateAnnotation, ConfigAnnotation)` 或直接从 `config.configurable` 取值。

为了简单，我建议你用一个 `deps` 对象直接注入。

---

## `apps/api/src/chat/graph/config.ts`

```ts
import { Annotation } from "@langchain/langgraph";
import type { ChatDeps } from "../runtime/create-chat-deps.js";

export const ChatGraphConfig = Annotation.Root({
	deps: Annotation<ChatDeps>,
});
```

---

## `apps/api/src/chat/runtime/create-chat-deps.ts`

```ts
import { HybridRetriever, MemoryWriter } from "@ai-companion/memory";
import type { ExecutionContext } from "@cloudflare/workers-types";
import type { Env } from "../../index.js";
import { createChatModel, createEmbeddings } from "../../lib/model.js";
import { createTracer } from "../../lib/tracing.js";
import { ChatService } from "../services/chat-service.js";
import { EmotionService } from "../services/emotion-service.js";
import { MemoryService } from "../services/memory-service.js";
import { PromptService } from "../services/prompt-service.js";
import { SessionService } from "../services/session-service.js";

export interface ChatDeps {
	emotionService: EmotionService;
	memoryService: MemoryService;
	promptService: PromptService;
	sessionService: SessionService;
	chatService: ChatService;
	executionCtx: ExecutionContext;
}

export function createChatDeps(env: Env, executionCtx: ExecutionContext): ChatDeps {
	const model = createChatModel(env);
	const embeddings = createEmbeddings(env);
	const tracing = createTracer(env);
	const callbacks = tracing ? [tracing.tracer] : [];
	const embedFn = { embed: (text: string) => embeddings.embedQuery(text) };

	const retriever = new HybridRetriever({
		vectorize: env.VECTORIZE,
		db: env.DB,
		kv: env.KV,
		embedFn,
	});

	const writer = new MemoryWriter({
		vectorize: env.VECTORIZE,
		db: env.DB,
		kv: env.KV,
		embedFn,
	});

	const emotionService = new EmotionService(env.KV, model, callbacks);
	const memoryService = new MemoryService({
		retriever,
		writer,
		model,
		callbacks,
		tracing,
	});
	const promptService = new PromptService();
	const sessionService = new SessionService(env.DB, writer);
	const chatService = new ChatService(model, callbacks);

	return {
		emotionService,
		memoryService,
		promptService,
		sessionService,
		chatService,
		executionCtx,
	};
}
```

---

# 五、service 草图

---

## 1. EmotionService

职责：

- load emotion + decay
- load profile
- classify event
- transition
- save emotion

```ts
export class EmotionService {
	async loadEmotion(sessionId: string): Promise<EmotionContext> {}
	async loadUserProfile(sessionId: string): Promise<UserProfile> {}
	async classifyEvent(message: string): Promise<EmotionEvent | null> {}
	transition(emotion: EmotionContext, event: EmotionEvent | null): EmotionContext {}
	async saveEmotion(sessionId: string, emotion: EmotionContext): Promise<void> {}
}
```

把现在这些逻辑收进去：

- `apps/api/src/routes/chat.ts:27-49`
- `apps/api/src/routes/chat.ts:75-95`
- `apps/api/src/lib/emotion-classifier.ts:58`

---

## 2. MemoryService

职责：

- retrieve memory
- schedule extraction
- write extracted memories

```ts
export class MemoryService {
	async retrieve(message: string, sessionId: string) {}
	async extract(sessionId: string, userMessage: string, assistantReply: string) {}
	async writeExtracted(sessionId: string, docs: MemoryDocument[]) {}
	scheduleExtraction(params: {
		executionCtx: ExecutionContext;
		sessionId: string;
		userMessage: string;
		assistantReply: string;
	}) {}
}
```

把这些逻辑收进去：

- `apps/api/src/routes/chat.ts:82-86`
- `apps/api/src/routes/chat.ts:137-156`
- `apps/api/src/lib/memory-extractor.ts:40`

---

## 3. SessionService

职责：

- load recent KV history
- persist KV short-term context
- persist D1 messages

```ts
export class SessionService {
	async loadSessionMessages(sessionId: string) {}
	async persistTurn(params: {
		sessionId: string;
		userMessage: string;
		assistantReply: string;
		emotion: EmotionContext;
		now: number;
	}) {}
}
```

对应现在：

- `apps/api/src/routes/chat.ts:99-104`
- `apps/api/src/routes/chat.ts:112-135`

---

## 4. PromptService

```ts
export class PromptService {
	buildPrompt(input: { emotion: EmotionContext; memories: MemoryDocument[]; userProfile: UserProfile }): string {}
}
```

对应：

- `apps/api/src/routes/chat.ts:96-97`

---

## 5. ChatService

```ts
export class ChatService {
	async generateReply(input: {
		userId: string;
		sessionId: string;
		systemPrompt: string;
		historyMessages: Array<{ role: "user" | "assistant"; content: string }>;
		message: string;
	}): Promise<string> {}
}
```

对应：

- `apps/api/src/routes/chat.ts:105-110`

---

# 六、node 划分

这里我按“**节点单职责**”来切。

---

## `load-context.ts`

职责：

- load emotion + decay
- load user profile
- 设置 now

返回：

```ts
{
  emotion,
  userProfile,
  now: Date.now(),
}
```

---

## `retrieve-memory.ts`

职责：

- 调 `memoryService.retrieve()`

返回：

```ts
{
	memories;
}
```

---

## `classify-emotion.ts`

职责：

- 调 `emotionService.classifyEvent()`

返回：

```ts
{
	emotionEvent;
}
```

---

## `update-emotion.ts`

职责：

- 按 `emotion + emotionEvent` 做 FSM transition

返回：

```ts
{
	emotion: updatedEmotion;
}
```

这是个很适合保持纯逻辑的节点。

---

## `load-session.ts`

职责：

- 调 `sessionService.loadSessionMessages()`

返回：

```ts
{
	sessionMessages;
}
```

---

## `build-prompt.ts`

职责：

- 调 `promptService.buildPrompt()`

返回：

```ts
{
	systemPrompt;
}
```

---

## `generate-reply.ts`

职责：

- 调模型生成 reply

返回：

```ts
{
	reply;
}
```

---

## `persist-turn.ts`

职责：

- 写 session context
- 写 emotion context
- 写 D1 messages

返回：

```ts
{
}
```

---

## `schedule-memory-extraction.ts`

职责：

- 触发 `executionCtx.waitUntil(...)`
- 后台提取 memory

返回：

```ts
{
}
```

注意：这个节点**不是必须同步等待**，只是调度后台任务。

---

## `build-response.ts`

职责：

- 组装最终 `ChatResponse`

返回：

```ts
{
  response: {
    reply,
    emotion,
    sessionId,
  }
}
```

---

# 七、graph 结构

你现在最适合的是 **deterministic workflow graph**，不是 agent graph。

---

## 最小推荐版本

```txt
START
  -> loadContext
  -> retrieveMemory
  -> classifyEmotion
  -> updateEmotion
  -> loadSession
  -> buildPrompt
  -> generateReply
  -> persistTurn
  -> scheduleMemoryExtraction
  -> buildResponse
  -> END
```

---

## 稍微进阶一点，加条件路由

```txt
START
  -> loadContext
  -> routeRetrieveMemory
    -> retrieveMemory
    -> skipRetrieveMemory
  -> classifyEmotion
  -> updateEmotion
  -> loadSession
  -> buildPrompt
  -> generateReply
  -> persistTurn
  -> routeExtractMemory
    -> scheduleMemoryExtraction
    -> skipExtractMemory
  -> buildResponse
  -> END
```

---

## 为什么不先上“并行节点”？

因为你现在第一阶段目标是**拆职责，不是秀 graph 能力**。

你原先 `classify emotion + retrieve memory` 是 `Promise.all`，这没问题，但在第一版 graph 里不一定必须显式做并行 fan-out。你可以：

- 先拆成两个独立节点，串行也行
- 或者保留一个 `preprocess` 节点，内部 `Promise.all`

我更推荐：

### 第一阶段

用一个节点：

- `preprocess.ts`
  - 并行 classify + retrieve

### 第二阶段

如果以后要做更细 routing，再拆成两个节点。

---

# 八、我建议的“第一版 graph”更现实

因为你现在不是从零开始，所以我建议第一版别拆太碎。

---

## 第一版节点建议

```txt
START
-> loadContext
-> preprocess
-> updateEmotion
-> loadSession
-> buildPrompt
-> generateReply
-> persistTurn
-> scheduleMemoryExtraction
-> buildResponse
-> END
```

其中：

### `preprocess`

内部做：

```ts
const [emotionEvent, memories] = await Promise.all([
	emotionService.classifyEvent(state.message),
	memoryService.retrieve(state.message, state.sessionId),
]);

return { emotionEvent, memories };
```

这样有几个好处：

- 保留你现在线程模型
- 节点数不至于爆炸
- 迁移快
- 后面还可以继续拆

---

# 九、graph.ts 草图

---

## `apps/api/src/chat/graph/graph.ts`

```ts
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatGraphConfig } from "./config.js";
import { buildPromptNode } from "./nodes/build-prompt.js";
import { buildResponseNode } from "./nodes/build-response.js";
import { generateReplyNode } from "./nodes/generate-reply.js";
import { loadContextNode } from "./nodes/load-context.js";
import { loadSessionNode } from "./nodes/load-session.js";
import { persistTurnNode } from "./nodes/persist-turn.js";
import { preprocessNode } from "./nodes/preprocess.js";
import { scheduleMemoryExtractionNode } from "./nodes/schedule-memory-extraction.js";
import { updateEmotionNode } from "./nodes/update-emotion.js";
import { ChatGraphState } from "./state.js";

export function createChatGraph() {
	return new StateGraph(ChatGraphState, ChatGraphConfig)
		.addNode("loadContext", loadContextNode)
		.addNode("preprocess", preprocessNode)
		.addNode("updateEmotion", updateEmotionNode)
		.addNode("loadSession", loadSessionNode)
		.addNode("buildPrompt", buildPromptNode)
		.addNode("generateReply", generateReplyNode)
		.addNode("persistTurn", persistTurnNode)
		.addNode("scheduleMemoryExtraction", scheduleMemoryExtractionNode)
		.addNode("buildResponse", buildResponseNode)

		.addEdge(START, "loadContext")
		.addEdge("loadContext", "preprocess")
		.addEdge("preprocess", "updateEmotion")
		.addEdge("updateEmotion", "loadSession")
		.addEdge("loadSession", "buildPrompt")
		.addEdge("buildPrompt", "generateReply")
		.addEdge("generateReply", "persistTurn")
		.addEdge("persistTurn", "scheduleMemoryExtraction")
		.addEdge("scheduleMemoryExtraction", "buildResponse")
		.addEdge("buildResponse", END)
		.compile();
}
```

这就是最稳的一版。

---

# 十、node 写法示意

---

## `load-context.ts`

```ts
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatGraphConfig } from "../config.js";
import { ChatGraphState } from "../state.js";
import { getDeps } from "../utils.js";

export async function loadContextNode(
	state: typeof ChatGraphState.State,
	config: RunnableConfig<typeof ChatGraphConfig.State>
) {
	const { emotionService } = getDeps(config);

	const [emotion, userProfile] = await Promise.all([
		emotionService.loadEmotion(state.sessionId),
		emotionService.loadUserProfile(state.sessionId),
	]);

	return {
		emotion,
		userProfile,
		now: Date.now(),
	};
}
```

---

## `preprocess.ts`

```ts
export async function preprocessNode(state, config) {
	const { emotionService, memoryService } = getDeps(config);

	const [emotionEvent, memories] = await Promise.all([
		emotionService.classifyEvent(state.message),
		memoryService.retrieve(state.message, state.sessionId),
	]);

	return {
		emotionEvent,
		memories,
	};
}
```

---

## `update-emotion.ts`

```ts
export async function updateEmotionNode(state, config) {
	const { emotionService } = getDeps(config);

	return {
		emotion: emotionService.transition(state.emotion!, state.emotionEvent ?? null),
	};
}
```

---

## `generate-reply.ts`

```ts
export async function generateReplyNode(state, config) {
	const { chatService } = getDeps(config);

	const reply = await chatService.generateReply({
		userId: state.userId,
		sessionId: state.sessionId,
		systemPrompt: state.systemPrompt!,
		historyMessages: state.sessionMessages,
		message: state.message,
	});

	return { reply };
}
```

---

## `persist-turn.ts`

```ts
export async function persistTurnNode(state, config) {
	const { emotionService, sessionService } = getDeps(config);

	await Promise.all([
		emotionService.saveEmotion(state.sessionId, state.emotion!),
		sessionService.persistTurn({
			sessionId: state.sessionId,
			userMessage: state.message,
			assistantReply: state.reply!,
			emotion: state.emotion!,
			now: state.now!,
		}),
	]);

	return {};
}
```

---

## `schedule-memory-extraction.ts`

```ts
export async function scheduleMemoryExtractionNode(state, config) {
	const { memoryService, executionCtx } = getDeps(config);

	memoryService.scheduleExtraction({
		executionCtx,
		sessionId: state.sessionId,
		userMessage: state.message,
		assistantReply: state.reply!,
	});

	return {};
}
```

---

## `build-response.ts`

```ts
export function buildResponseNode(state: typeof ChatGraphState.State) {
	return {
		response: {
			reply: state.reply!,
			emotion: state.emotion!,
			sessionId: state.sessionId,
		},
	};
}
```

---

# 十一、router 预留点

虽然第一版可以先不用，但我建议目录先留好。

---

## `should-retrieve-memory.ts`

适合以后做这些策略：

- 短寒暄不检索
- 某些 message 太短不检索
- 某些 session 模式关闭检索

```ts
export function shouldRetrieveMemory(state) {
	if (state.message.trim().length < 4) return "skip";
	return "retrieve";
}
```

---

## `should-extract-memory.ts`

适合以后做：

- 回复过短不抽
- 纯闲聊不抽
- 只有高价值内容才抽

```ts
export function shouldExtractMemory(state) {
	if (!state.reply) return "skip";
	return "extract";
}
```

---

# 十二、和你当前文件的映射关系

把你当前 `apps/api/src/routes/chat.ts` 拆开，大概对应：

---

## `apps/api/src/routes/chat.ts:27-49`

迁到：

- `repositories/emotion-repository.ts`
- `repositories/profile-repository.ts`
- `services/emotion-service.ts`

---

## `apps/api/src/routes/chat.ts:59-74`

迁到：

- `chat/runtime/create-chat-deps.ts`

---

## `apps/api/src/routes/chat.ts:75-80`

迁到：

- `load-context.ts`
- `emotion-service.ts`

---

## `apps/api/src/routes/chat.ts:82-86`

迁到：

- `preprocess.ts`
- `memory-service.ts`
- `emotion-service.ts`

---

## `apps/api/src/routes/chat.ts:88-95`

迁到：

- `update-emotion.ts`
- `emotion-service.ts`

---

## `apps/api/src/routes/chat.ts:96-97`

迁到：

- `build-prompt.ts`
- `prompt-service.ts`

---

## `apps/api/src/routes/chat.ts:99-104`

迁到：

- `load-session.ts`
- `session-service.ts`

---

## `apps/api/src/routes/chat.ts:105-110`

迁到：

- `generate-reply.ts`
- `chat-service.ts`

---

## `apps/api/src/routes/chat.ts:112-135`

迁到：

- `persist-turn.ts`
- `session-service.ts`
- `emotion-service.ts`

---

## `apps/api/src/routes/chat.ts:137-156`

迁到：

- `schedule-memory-extraction.ts`
- `memory-service.ts`

---

# 十三、Worker 环境下的现实建议

这个点很重要。

---

## 1. 先不要急着上 checkpointer

虽然 LangGraph 支持 checkpoint，但你这里已有：

- KV：emotion + ctx
- D1：messages + memories
- Vectorize：semantic memory

这些已经是你的真实持久层了。

所以第一阶段：

- `graph.invoke(input, { configurable: { deps } })`

就够了。

---

## 2. graph 是 orchestration，不替代存储

不要想成：

“上了 LangGraph 就不用 KV/D1 了”

不是的。这里 LangGraph 的价值主要是：

- 编排透明
- 节点边界清晰
- 扩展点自然
- tracing 更好挂

存储还是你自己的。

---

## 3. `waitUntil` 先保留

`apps/api/src/routes/chat.ts:138` 现在异步 memory extraction 其实是对的。

第一版 graph 不需要强行把它变成同步节点执行完再返回，否则延迟会更差。

所以建议：

- 主 graph 同步到 `persistTurn`
- `scheduleMemoryExtraction` 只负责后台调度

---

# 十四、迁移顺序

建议按这个顺序改，风险最低。

---

## Phase 1：先抽 service，不引入 graph

先把 `chat.ts` 变薄一点：

- `EmotionService`
- `MemoryService`
- `SessionService`
- `PromptService`
- `ChatService`

但 route 里还是顺序调用。

这样你先把逻辑分层。

---

## Phase 2：把 route 编排迁到 graph

新增：

- `chat/graph/state.ts`
- `chat/graph/graph.ts`
- `chat/graph/nodes/*`

然后 route 改成 invoke graph。

---

## Phase 3：再加条件路由

后续再加：

- `shouldRetrieveMemory`
- `shouldExtractMemory`
- fallback model
- tool calling
- safety review

---

# 十五、我对你这个项目的最推荐版本

如果我要帮你真动手改，我会选这个“第一阶段可落地版本”：

### graph 节点

- `loadContext`
- `preprocess`
- `updateEmotion`
- `loadSession`
- `buildPrompt`
- `generateReply`
- `persistTurn`
- `scheduleMemoryExtraction`
- `buildResponse`

### service

- `EmotionService`
- `MemoryService`
- `SessionService`
- `PromptService`
- `ChatService`

### route

只负责：

- validate
- create deps
- invoke graph
- return json

这是最符合你当前代码量和复杂度的解法。

---

# 十六、一个简化版最终示意

## 最终 `routes/chat.ts`

```ts
export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
	const body = await c.req.json<ChatRequest>();
	const { userId, message, sessionId } = body;

	if (!userId || !message || !sessionId) {
		return c.json({ error: "userId, message, sessionId are required" }, 400);
	}

	const graph = createChatGraph();
	const deps = createChatDeps(c.env, c.executionCtx);

	const result = await graph.invoke({ userId, message, sessionId }, { configurable: { deps } });

	return c.json(result.response);
}
```

## 最终 `graph.ts`

```ts
START
-> loadContext
-> preprocess
-> updateEmotion
-> loadSession
-> buildPrompt
-> generateReply
-> persistTurn
-> scheduleMemoryExtraction
-> buildResponse
-> END
```

---

如果你愿意，我下一步可以继续直接给你两样东西里的任意一个：

1. **文件级 skeleton**：把这些文件的 TS 骨架直接列出来
2. **渐进式改造方案**：按提交粒度拆成 3~5 步，方便你一边改一边跑通

如果你想更直接一点，我也可以直接开始给你写 **`state.ts + graph.ts + services interface` 初稿**。
