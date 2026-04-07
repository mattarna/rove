# ROVE Chatbot Agent - IDE Rules

> **Cos'è questo documento:** Le regole che l'IDE AI-assisted (AntiGravity, Cursor, o qualsiasi agente di codice) deve seguire quando genera codice per questo progetto. Queste regole garantiscono consistenza, sicurezza e allineamento architetturale. L'IDE deve leggere questo file all'inizio di ogni sessione di lavoro.

---

## Project Context

This is a multi-agent AI chatbot built with Next.js (App Router). Read `docs/_INDEX.md` first, then `docs/01_Master_Brief.md` for full context. All documentation lives in `docs/`.

## Stack & Dependencies

- **Framework:** Next.js 14+ with App Router (`/app` directory, NOT `/pages`)
- **Frontend:** React 18+ with Tailwind CSS
- **LLM Integration:** Vercel AI SDK (`ai` package) + provider-specific package
  - Claude: `@ai-sdk/anthropic`
  - Gemini: `@ai-sdk/google`
  - GPT: `@ai-sdk/openai`
- **Language:** TypeScript (strict mode)
- **Package Manager:** npm
- **Deploy Target:** Vercel

## File Structure

```
/app
  /api
    /chat
      route.ts          ← single API route for all chat messages
  layout.tsx
  page.tsx              ← main chat page
  globals.css

/components
  ChatWindow.tsx        ← main chat container
  MessageBubble.tsx     ← single message with agent indicator
  ChatInput.tsx         ← input field + send button
  AgentIndicator.tsx    ← name + color dot showing active agent

/lib
  manager.ts            ← Manager Agent logic (routing LLM call)
  agents.ts             ← Agent execution logic (specialist LLM call)
  kb.ts                 ← KB file loader (reads .md files)
  prompts.ts            ← Maps agent name → system prompt content
  types.ts              ← Shared TypeScript types

/docs                   ← Knowledge Base + system prompts (already created)
  03_Shared_KB.md
  04_Discovery_Prompt.md
  05_Discovery_KB.md
  06_Sales_Prompt.md
  07_Sales_KB.md
  08_Support_Prompt.md
  09_Support_KB.md
  10_Manager_Prompt.md

.env.local              ← API key (NEVER commit)
```

## Naming Conventions

- **Files:** kebab-case for non-component files (`agent-router.ts`), PascalCase for React components (`ChatWindow.tsx`)
- **Variables/Functions:** camelCase (`getAgentResponse`, `loadKnowledgeBase`)
- **Types/Interfaces:** PascalCase with prefix for clarity (`AgentName`, `ChatMessage`, `ManagerResponse`)
- **Constants:** UPPER_SNAKE_CASE (`AGENT_COLORS`, `MAX_HISTORY_LENGTH`)
- **Agent names in code:** Always lowercase strings: `"discovery"`, `"sales"`, `"support"`

## TypeScript Types (Core)

```typescript
type AgentName = "discovery" | "sales" | "support";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agent?: AgentName;
}

interface ManagerResponse {
  agent: AgentName;
  reason: string;
}

interface AgentConfig {
  name: AgentName;
  displayName: string;
  color: string;
  systemPrompt: string;
  knowledgeBase: string;
}
```

## Architecture Rules

### Two LLM Calls Per User Message

Every user message triggers exactly TWO LLM calls in sequence:

1. **Manager Call** (lightweight, JSON mode): Receives user message + history + current agent. Returns `{ agent, reason }`. Use low temperature (0-0.1) and max_tokens ~100.
2. **Agent Call** (full, streaming): Receives system prompt + shared KB + vertical KB + conversation history. Returns streamed text response.

NEVER skip the Manager call. NEVER combine them into one call. This separation is fundamental to the architecture.

### KB Loading

- Read `.md` files from the filesystem using `fs.readFileSync` or `fs.promises.readFile`
- Load at request time, NOT at build time (KB content must be fresh on each request)
- Each agent gets: Shared KB (`03_Shared_KB.md`) + its own vertical KB
- System prompt and KB are concatenated into a single system message
- Path resolution: use `path.join(process.cwd(), "docs", filename)`

### Conversation History

- History is managed in React state on the frontend (`useState<ChatMessage[]>`)
- The full history is sent to the API on every request
- **Before sending to any LLM call, truncate history to the last 20 messages** to prevent context window overflow (see Risk R1 in `02_Risk_and_Constraints.md`)
- No server-side storage, no database, no cookies
- If the page reloads, the conversation resets (this is by design)

### Streaming

- Use Vercel AI SDK's `streamText` function for the Agent call
- The Manager call does NOT need streaming (it returns a small JSON)
- Frontend uses `useChat` hook from `ai/react` OR manual fetch with ReadableStream

## Security Rules

- **API key in `.env.local` ONLY.** Never hardcode API keys. Access via `process.env.ANTHROPIC_API_KEY` (or equivalent).
- **`.env.local` in `.gitignore`.** Always. No exceptions.
- **No API key on the client side.** All LLM calls happen server-side in the API route.
- **No `"use client"` on files that handle API keys or LLM calls.**
- **Validate `agent` field:** If Manager returns an invalid agent name, default to `"discovery"`.

## Patterns to Follow

- **One API route only:** `/app/api/chat/route.ts` handles everything. Do not create separate routes per agent.
- **Agent config as a map:** Use a `Record<AgentName, AgentConfig>` to centralize agent metadata (name, color, prompt file, KB file).
- **Error handling:** If the Manager call fails, default to current agent. If the Agent call fails, return a user-friendly error in Italian: "Mi scuso, ho un problema tecnico. Riprova tra un momento."
- **No `any` type.** Use proper TypeScript types for everything.
- **Server Components by default.** Only add `"use client"` to components that need interactivity (ChatWindow, ChatInput).

## Patterns to AVOID

- **No RAG, no vector store, no embeddings.** KB files are read as plain text and injected into the prompt.
- **No database.** No Prisma, no Drizzle, no Supabase, no Firebase.
- **No authentication.** No NextAuth, no Clerk, no session management.
- **No external CSS frameworks** beyond Tailwind. No Material UI, no Chakra, no styled-components.
- **No `/pages` directory.** This is an App Router project.
- **No `getServerSideProps` or `getStaticProps`.** Those are Pages Router patterns.
- **No environment variable prefixed with `NEXT_PUBLIC_` for API keys.** That exposes them to the client.

## Agent Visual Identity (for UI)

```typescript
const AGENT_COLORS: Record<AgentName, string> = {
  discovery: "#6475FA",  // viola
  sales: "#E8650A",      // arancio
  support: "#22C55E",    // verde
};

const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  discovery: "ROVE Discovery",
  sales: "ROVE Sales",
  support: "ROVE Support",
};
```

## Multi-Provider LLM Configuration

The file `/lib/llm-client.ts` must expose two functions:
1. `getManagerModel()` — Returns the fast model for routing (Haiku/Flash/4o-mini)
2. `getAgentModel()` — Returns the full model for responses (Sonnet/Pro/4o)

The student chooses their provider by uncommenting ONE block in the file. The rest of the codebase does not change.

```typescript
// === CHOOSE YOUR PROVIDER: uncomment ONE block ===

// --- CLAUDE (Anthropic) ---
// import { anthropic } from '@ai-sdk/anthropic';
// export const getManagerModel = () => anthropic('claude-haiku-4-5-20241022');
// export const getAgentModel = () => anthropic('claude-sonnet-4-20250514');

// --- GEMINI (Google) ---
// import { google } from '@ai-sdk/google';
// export const getManagerModel = () => google('gemini-2.0-flash');
// export const getAgentModel = () => google('gemini-2.5-pro-preview-05-06');

// --- GPT (OpenAI) ---
// import { openai } from '@ai-sdk/openai';
// export const getManagerModel = () => openai('gpt-4o-mini');
// export const getAgentModel = () => openai('gpt-4o');
```

Environment variable per provider (in `.env.local`):
- Claude: `ANTHROPIC_API_KEY=sk-ant-...`
- Gemini: `GOOGLE_GENERATIVE_AI_API_KEY=...`
- GPT: `OPENAI_API_KEY=sk-...`

Only ONE key is needed. The student installs only the provider package they use:
- `npm install @ai-sdk/anthropic` OR `npm install @ai-sdk/google` OR `npm install @ai-sdk/openai`

## Git Rules

- Commit messages in English, imperative mood: "Add manager routing logic", "Fix streaming response format"
- Never commit `.env.local`, `node_modules/`, `.next/`
- `.gitignore` must include at minimum: `.env.local`, `node_modules/`, `.next/`, `*.log`

## Task Tracking

All tasks in the plan documents (`plans/01_Master_Plan.md` and `plans/02_Sub_Plan_Sprint_*.md`) use checkbox notation to track progress:

- `[ ]` — task not yet started or in progress
- `[x]` — task completed and verified

**Rules:**
- When you complete a task, immediately update the corresponding `[ ]` to `[x]` in the Sub-Plan file.
- When all tasks in a sprint are marked `[x]`, update the sprint header in `01_Master_Plan.md` from `[ ]` to `[x]`.
- Never mark a task `[x]` until its success criterion is fully satisfied — not just implemented, but verified.
- If a task is partially complete or blocked, leave it as `[ ]` and add a comment below it explaining the blocker.
- Do not renumber or restructure tasks. The task IDs (e.g., `3.2`, `5.7`) are stable references used in team communication.

## Testing

- No automated tests required. Validation is manual: run a conversation through all 3 agents and verify correct routing, responses, and UI changes.
- Test scenarios:
  1. New user → Discovery qualifies → handoff to Sales → Sales presents packages
  2. User mentions existing booking → Support activates immediately
  3. User in Sales asks support question → Support activates → returns to Sales on next non-support message
