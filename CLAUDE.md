# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tooling and commands

- Package manager: Yarn 1.22 workspace monorepo (`yarn@1.22.22`).
- Runtime: Node 20+.
- Root commands:
  - `yarn dev` — runs Turbo dev tasks for the repo.
  - `yarn build` — runs workspace builds.
  - `yarn lint` — runs lint tasks across the repo; this is currently most relevant for `apps/web`.
  - `yarn type-check` — runs `tsc --noEmit` across workspaces.
- Workspace commands:
  - `yarn workspace @ai-companion/web dev|build|start|lint|type-check`
  - `yarn workspace @ai-companion/api dev|build|deploy|type-check|d1:local:migrate`
- Playground:
  - `cd playground && yarn test` — runs `tsx scripts/run.ts`.
- Single-test note:
  - There is no repo-wide Jest/Vitest-style test harness yet, so single-test execution is not wired up. Validate changes with `yarn type-check`, the relevant workspace command, and the playground runner when touching `playground/`.
- Turbo notes:
  - `dev` is persistent and uncached.
  - `lint` and `type-check` depend on upstream builds.
- API build note:
  - `yarn workspace @ai-companion/api build` runs `wrangler deploy --dry-run`; use `deploy` for a real Worker deploy.

## Repository shape

- `apps/web` — Next.js 15 frontend. `src/app/page.tsx` renders the chat UI, and `src/lib/api.ts` calls the Worker API. `src/components/chat/chat-window.tsx` currently uses fixed `USER_ID` and `SESSION_ID` constants.
- `apps/api` — Cloudflare Worker API built with Hono. Entry point is `src/index.ts`; Cloudflare bindings are declared in `wrangler.toml`.
- `packages/types` — shared contracts for chat, emotion, memory, prompt, and session types.
- `packages/emotion` — six-state emotion FSM (`calm`, `happy`, `angry`, `sad`, `shy`, `jealous`), plus cooldown, decay, and intimacy logic.
- `packages/memory` — hybrid retrieval and persistence across KV, D1, and Vectorize.
- `packages/prompt` — runtime system prompt assembly.
- `playground` — local LangChain/LangGraph experiments; not production app code.

## Chat request flow

`apps/api/src/routes/chat.ts` is the main request path for `POST /chat`:

1. Load emotion state from KV and apply decay.
2. Load the user profile from KV.
3. In parallel, classify the new user message into an emotion event and retrieve memories with the hybrid retriever.
4. Apply the FSM transition and intimacy update.
5. Assemble the system prompt.
6. Load short-term session context from KV (`ctx:${sessionId}`), keeping only the last 20 messages.
7. Invoke the chat model.
8. Persist updated session context and emotion state to KV, and append both messages to D1.
9. Kick off async memory extraction with `executionCtx.waitUntil(...)`, then write extracted memories in the background.

## Prompt, memory, and state model

- Prompt assembly order is fixed: safety → persona → emotion → memory.
- Memory retrieval fuses four channels with weighted scoring: semantic vector search, structured fact/profile lookup, recent summaries, and keyword search.
- KV keys used by the API:
  - `emotion:${sessionId}` — current emotion context
  - `profile:${sessionId}` — user profile
  - `ctx:${sessionId}` — short-term session context with a 24h TTL
- D1 stores chat history and structured memories.
- Vectorize is used for semantic retrieval; the current writer only upserts `event` and `keyword` memory types.
- API bindings expected in Cloudflare are `KV`, `DB`, `VECTORIZE`, and DeepSeek env vars; LangSmith tracing is optional.

## Formatting conventions

- Prettier is the formatting source of truth: tabs, semicolons, trailing commas, and `printWidth: 120`.
- Imports are sorted with `@trivago/prettier-plugin-sort-imports`.
- Tailwind class ordering is handled by `prettier-plugin-tailwindcss`.
- Recent git history uses Conventional Commit prefixes such as `feat:`, `refactor:`, and `chore:`.
