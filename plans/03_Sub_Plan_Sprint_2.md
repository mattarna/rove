# Sub-Plan — Sprint 2: Knowledge Base + LLM Integration (Discovery)

> **What is this document:** The detailed Sub-Plan for Sprint 2 of the ROVE chatbot Master Plan. This sprint connects the chatbot to a real LLM and loads the Knowledge Base files, making Discovery the first functional AI agent.

**Sprint Objective:** Build the Knowledge Base loading system, configure the multi-provider LLM client, and make the Discovery agent work with real AI model responses. At the end of this sprint, the chatbot responds as ROVE Discovery using the Shared KB and the Discovery KB.

**Estimated Time:** ~45 minutes

**Dependencies:** Sprint 1 completed.

**Risks Mitigated:** R1 (Context window overflow), R5 (API key exposed)

---

### [x] Task 2.1 — Create the Knowledge Base loader

**Files involved:** `/lib/kb.ts` (create new)

**Required input:** Sprint 1 completed. The `/docs/` directory contains the KB and prompt markdown files (already present in the repository).

**Expected output:** A file at `/lib/kb.ts` that exports a function `loadKnowledgeBase(filename: string): string` which:
1. Takes a filename (e.g., `'03_Shared_KB.md'`)
2. Reads the file from `path.join(process.cwd(), 'docs', filename)` using `fs.readFileSync` with `'utf-8'` encoding
3. Returns the full file content as a string
4. Wraps the read in a try/catch: if the file does not exist, logs `console.error` with the filename and returns an empty string

**Success criterion:** Calling `loadKnowledgeBase('03_Shared_KB.md')` returns a string that starts with `# ROVE - Shared Knowledge Base`. Calling `loadKnowledgeBase('nonexistent.md')` returns an empty string without crashing.

---

### [x] Task 2.2 — Create the LLM client configuration

**Files involved:** `/lib/llm-client.ts` (create new), `/.env.local` (modify)

**Required input:** Task 1.2 completed (AI SDK packages installed). Task 1.4 completed (`.env.local` exists).

**Expected output:** A file at `/lib/llm-client.ts` that:
1. Exports two functions: `getManagerModel()` and `getAgentModel()`
2. Contains three blocks (one per provider: Claude, Gemini, GPT), with TWO blocks commented out and ONE active
3. The default active provider is Claude (Anthropic):
```typescript
import { anthropic } from '@ai-sdk/anthropic';
export const getManagerModel = () => anthropic('claude-haiku-4-5-20241022');
export const getAgentModel = () => anthropic('claude-sonnet-4-20250514');
```
4. The commented blocks for Gemini and GPT use:
   - Gemini: `google('gemini-2.0-flash')` and `google('gemini-2.5-pro-preview-05-06')`
   - GPT: `openai('gpt-4o-mini')` and `openai('gpt-4o')`
5. Each block has a clear comment header explaining how to switch

Also update `/.env.local` by uncommenting the `ANTHROPIC_API_KEY` line (or the student's chosen provider) and adding a real API key.

**Success criterion:** The file compiles without TypeScript errors. Importing `getAgentModel` from another file returns a valid model object (verified in the next task when we make the first LLM call).

---

### [x] Task 2.3 — Create the prompts mapper

**Files involved:** `/lib/prompts.ts` (create new)

**Required input:** Task 2.1 completed (KB loader exists). The `/docs/` directory contains all prompt files.

**Expected output:** A file at `/lib/prompts.ts` that exports a function `getAgentSystemPrompt(agent: AgentName): string` which:
1. Uses `loadKnowledgeBase()` to read the system prompt file for the given agent:
   - `'discovery'` → reads `04_Discovery_Prompt.md`
   - `'sales'` → reads `06_Sales_Prompt.md`
   - `'support'` → reads `08_Support_Prompt.md`
2. Uses `loadKnowledgeBase()` to read the Shared KB (`03_Shared_KB.md`)
3. Uses `loadKnowledgeBase()` to read the vertical KB for the given agent:
   - `'discovery'` → reads `05_Discovery_KB.md`
   - `'sales'` → reads `07_Sales_KB.md`
   - `'support'` → reads `09_Support_KB.md`
4. Concatenates them into a single string with clear section separators:
```
[SYSTEM PROMPT]
{system prompt content}

[SHARED KNOWLEDGE BASE]
{shared KB content}

[SPECIALIST KNOWLEDGE BASE]
{vertical KB content}
```
5. Returns the concatenated string

**Success criterion:** Calling `getAgentSystemPrompt('discovery')` returns a string that contains all three sections: the Discovery system prompt (includes "SCOPE & ROLE"), the Shared KB (includes "IDENTITY & BRAND"), and the Discovery vertical KB (includes "Three-Question Qualification Sequence").

---

### [x] Task 2.4 — Create the agents configuration and history truncation

**Files involved:** `/lib/agents.ts` (create new)

**Required input:** Task 1.3 completed (types available).

**Expected output:** A file at `/lib/agents.ts` that exports:

1. `AGENT_COLORS` constant:
```typescript
export const AGENT_COLORS: Record<AgentName, string> = {
  discovery: '#6475FA',
  sales: '#E8650A',
  support: '#22C55E',
};
```

2. `AGENT_DISPLAY_NAMES` constant:
```typescript
export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  discovery: 'ROVE Discovery',
  sales: 'ROVE Sales',
  support: 'ROVE Support',
};
```

3. `VALID_AGENTS` array: `['discovery', 'sales', 'support'] as const`

4. `isValidAgent(agent: string): agent is AgentName` — type guard that checks if a string is a valid agent name

5. `truncateHistory(messages: ChatMessage[], maxLength: number = 20): ChatMessage[]` — implements context-first truncation:
   - If the array has fewer than `maxLength` messages, return it unchanged
   - Otherwise, ALWAYS keep the first user message (index 0 or the first message with `role: 'user'`) because it typically contains core preferences (destination, budget, group) that the agent needs throughout the conversation
   - Keep the last `maxLength - 1` messages
   - Return the preserved first message + the last N messages as a combined array

```typescript
export function truncateHistory(messages: ChatMessage[], maxLength: number = 20): ChatMessage[] {
  if (messages.length <= maxLength) return messages;
  const firstUserMessage = messages.find(m => m.role === 'user');
  const recentMessages = messages.slice(-(maxLength - 1));
  if (firstUserMessage && !recentMessages.includes(firstUserMessage)) {
    return [firstUserMessage, ...recentMessages];
  }
  return recentMessages;
}
```

**Success criterion:** `truncateHistory` with an array of 30 messages and default max returns exactly 20 messages. The first user message is always preserved even when truncation kicks in. `isValidAgent('sales')` returns `true`. `isValidAgent('invalid')` returns `false`. `AGENT_COLORS.discovery` returns `'#6475FA'`.

---

### [x] Task 2.5 — Update the API route to call the LLM with Discovery

**Files involved:** `/app/api/chat/route.ts` (modify)

**Required input:** Tasks 2.1 through 2.4 completed. A valid API key is in `.env.local`.

**Expected output:** The API route is updated to:
1. Import `generateText` from `'ai'`
2. Import `getAgentModel` from `/lib/llm-client`
3. Import `getAgentSystemPrompt` from `/lib/prompts`
4. Import `truncateHistory` from `/lib/agents`
5. Replace the hardcoded response with a real LLM call:
   - Truncate the incoming message history to 20 messages
   - Build the system message using `getAgentSystemPrompt('discovery')`
   - Call `generateText` with the agent model, system message, and truncated history
   - Return the LLM response text in the JSON: `{ agent: "discovery", message: result.text, color: "#6475FA" }`
6. Wrap the LLM call in try/catch: on error, return status 500 with `{ agent: "discovery", message: "Mi scuso, ho un problema tecnico. Riprova tra un momento.", color: "#6475FA" }`

NOTE: In this sprint, the agent is always `'discovery'`. The Manager routing is added in Sprint 3.

**Success criterion:** Sending a POST to `/api/chat` with `{ "messages": [{ "role": "user", "content": "Ciao, vorrei organizzare un viaggio" }], "currentAgent": null }` returns a response where:
- `agent` is `"discovery"`
- `message` contains a response in Italian that asks about travel preferences (consistent with the Discovery persona)
- The response is NOT the hardcoded text from Sprint 1 — it is generated by the LLM

---

### [x] Task 2.6 — Update the frontend to handle real LLM responses

**Files involved:** `/app/page.tsx` (modify)

**Required input:** Task 2.5 completed (API returns real LLM responses).

**Expected output:** Ensure the `handleSend` function in `page.tsx` correctly handles the new API response format. The flow should be:
1. User types a message → added to state
2. `isLoading` set to true
3. POST to `/api/chat` with messages array and currentAgent
4. Parse JSON response → extract `agent`, `message`, `color`
5. Add assistant message to state: `{ role: 'assistant', content: message, agent: agent }`
6. Update `currentAgent` from response
7. `isLoading` set to false

If already implemented correctly in Sprint 1, verify it still works and no changes are needed.

**Success criterion:** The chat interface shows real AI-generated responses from the Discovery agent. The responses are in Italian, conversational, and consistent with Discovery behavior (asks about travel preferences, budget, group composition — never mentions prices).

---

### [x] Task 2.7 — End-to-end verification of Sprint 2

**Files involved:** All files created/modified in this sprint.

**Required input:** All previous tasks completed. Real API key in `.env.local`.

**Expected output:** No new files. This is a verification task.

**Success criterion:** ALL of the following are true:
1. `npm run dev` starts without errors
2. Typing "Ciao, vorrei organizzare un viaggio" produces a response from Discovery in Italian
3. Discovery asks qualification questions (budget, travel style, group composition)
4. Discovery does NOT mention specific prices or resort names (per its prompt rules)
5. A multi-turn conversation (3-4 messages) works without errors
6. No API key appears in the browser console, network tab, or page source
7. No TypeScript compilation errors (`npx tsc --noEmit` passes)

**Note:** The `truncateHistory` function (Task 2.4) now implements context-first truncation by default, preserving the first user message to prevent the agent from losing core preferences (budget, destination, group) mid-conversation.
