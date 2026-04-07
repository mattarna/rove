# Sub-Plan — Sprint 3: Manager Agent + Routing

> **What is this document:** The detailed Sub-Plan for Sprint 3 of the ROVE chatbot Master Plan. This is the most critical sprint: it implements the double LLM call architecture (Manager + Specialist Agent) and the agent routing logic. This sprint introduces the core architectural pattern of the entire system.

**Sprint Objective:** Implement the Manager Agent that classifies user intent and routes to the correct specialist agent. At the end of this sprint, the chatbot has the double LLM call architecture (Manager + Agent) and the UI shows which agent is speaking.

**Estimated Time:** ~45 minutes

**Dependencies:** Sprint 2 completed.

**Risks Mitigated:** R2 (Inconsistent routing — CRITICAL), R3 (Double call latency)

---

### [x] Task 3.1 — Create the Manager Agent routing logic

**Files involved:** `/lib/manager.ts` (create new)

**Required input:** Sprint 2 completed. `/lib/llm-client.ts` exists with `getManagerModel()`. `/docs/10_Manager_Prompt.md` exists with the Manager system prompt.

**Expected output:** A file at `/lib/manager.ts` that exports:

1. `getManagerSystemPrompt(): string` — reads and returns the content of `docs/10_Manager_Prompt.md` using `loadKnowledgeBase()`

2. `routeMessage(userMessage: string, currentAgent: AgentName | null, history: ChatMessage[]): Promise<AgentName>` — async function that:
   a. Calls `generateText` from the `ai` package with:
      - Model: `getManagerModel()` (fast model: Haiku/Flash/4o-mini)
      - System: the Manager system prompt
      - Prompt: a JSON object formatted as string:
        ```json
        {
          "message": "{userMessage}",
          "current_agent": "{currentAgent || 'null'}",
          "history": [{truncated history, last 10 messages only for the Manager}]
        }
        ```
      - Temperature: 0 (deterministic)
      - Max tokens: 150
   b. Parses the response using `safeParseManagerResponse()` (Task 3.2)
   c. Returns the parsed agent name
   d. On any error (API failure, parsing failure), returns `currentAgent || 'discovery'` as fallback

**Success criterion:** Given a user message "Quanto costa un viaggio alle Maldive?" with `currentAgent = 'discovery'` and a history showing the user has already stated budget and preferences, the function returns `'sales'`. Given an error scenario (network failure), the function returns the current agent without crashing.

---

### [x] Task 3.2 — Implement safe JSON parser for Manager response

**Files involved:** `/lib/manager.ts` (add to existing file from Task 3.1)

**Required input:** Task 3.1 completed.

**Expected output:** A function `safeParseManagerResponse(rawText: string, currentAgent: AgentName | null): AgentName` exported from `/lib/manager.ts` that:

1. First attempt: `JSON.parse(rawText)` — if it works and has a valid `agent` field, return it
2. Second attempt: regex extraction — search for `\{[^}]*"agent"\s*:\s*"(discovery|sales|support)"[^}]*\}` in the raw text, parse the match
3. Third attempt: simple string search — look for `"discovery"`, `"sales"`, or `"support"` in the text and return the first match
4. Final fallback: return `currentAgent || 'discovery'`
5. At every stage, validate the extracted agent name using `isValidAgent()` from `/lib/agents.ts`

This handles the known failure modes:
- LLM wraps JSON in markdown code fences: `` ```json { "agent": "sales" } ``` ``
- LLM adds preamble text: `"Here is the routing: { "agent": "sales", "reason": "..." }"`
- LLM returns just the agent name without JSON

**Success criterion:** ALL of the following inputs return the correct agent:
- `'{"agent":"sales","reason":"budget stated"}'` → `'sales'`
- `` '```json\n{"agent":"support","reason":"existing booking"}\n```' `` → `'support'`
- `'The user should be routed to: {"agent":"discovery","reason":"new conversation"}'` → `'discovery'`
- `'sales'` → `'sales'`
- `'I think the agent should be discovery.'` → `'discovery'`
- `'completely invalid garbage'` with currentAgent `'sales'` → `'sales'`
- `'completely invalid garbage'` with currentAgent `null` → `'discovery'`

---

### [x] Task 3.3 — Update the API route for double LLM call architecture

**Files involved:** `/app/api/chat/route.ts` (modify)

**Required input:** Tasks 3.1 and 3.2 completed. `/lib/manager.ts` exports `routeMessage`.

**Expected output:** The API route is updated to implement the two-step LLM call:

1. **Step 1 — Manager routing:** Call `routeMessage(latestUserMessage, currentAgent, messages)` to determine which agent should respond
2. **Step 2 — Agent response:** Call `generateText` with:
   - Model: `getAgentModel()`
   - System: `getAgentSystemPrompt(selectedAgent)` (uses the agent determined by the Manager)
   - Messages: truncated history (last 20 messages)
3. Return the response:
```json
{
  "agent": "{selectedAgent}",
  "message": "{agent response text}",
  "color": "{AGENT_COLORS[selectedAgent]}"
}
```

The `currentAgent` field from the request body is passed to the Manager for context (stability bias — the Manager prefers to keep the current agent unless there is a clear signal to switch).

**Success criterion:** A conversation flow like this works correctly:
1. User: "Ciao, vorrei un viaggio" → Manager routes to Discovery → Discovery responds with qualification question
2. User: "Budget circa 6000 euro, coppia, relax" → Manager routes to Discovery → Discovery recommends Maldive
3. User: "Quanto costa il resort COMO Cocoa?" → Manager routes to Sales → Sales responds with pricing details
The `agent` field in each response matches the expected routing.

---

### [x] Task 3.4 — Update the AgentIndicator to use dynamic colors

**Files involved:** `/components/AgentIndicator.tsx` (modify)

**Required input:** Task 1.8 completed (AgentIndicator exists). `/lib/agents.ts` exists with `AGENT_COLORS` and `AGENT_DISPLAY_NAMES`.

**Expected output:** The AgentIndicator component is updated to:
1. Import `AGENT_COLORS` and `AGENT_DISPLAY_NAMES` from `/lib/agents`
2. Use inline style for the color dot: `style={{ backgroundColor: AGENT_COLORS[agentName] }}`
3. Display `AGENT_DISPLAY_NAMES[agentName]` for the text
4. Add a smooth CSS transition on the color change (e.g., `transition-colors duration-300`)

**Success criterion:** When the agent changes from Discovery to Sales, the dot color transitions smoothly from purple to orange and the name changes from "ROVE Discovery" to "ROVE Sales".

---

### [x] Task 3.5 — Update the MessageBubble to show agent-specific colors

**Files involved:** `/components/MessageBubble.tsx` (modify)

**Required input:** Task 1.7 completed (MessageBubble exists). `/lib/agents.ts` exists with `AGENT_COLORS` and `AGENT_DISPLAY_NAMES`.

**Expected output:** The MessageBubble component is updated so that:
1. If the message is from an assistant and has an `agent` field, the agent name label uses the agent's color
2. The label shows the agent display name (e.g., "ROVE Sales") in the corresponding color
3. The left border or accent of the assistant message bubble uses the agent's color (via inline style)

**Success criterion:** A message from Sales shows "ROVE Sales" in orange text/accent. A message from Support shows "ROVE Support" in green text/accent. A message from Discovery shows "ROVE Discovery" in purple text/accent.

---

### [x] Task 3.6 — Update the frontend to reflect agent switches

**Files involved:** `/app/page.tsx` (modify)

**Required input:** Tasks 3.3, 3.4, 3.5 completed.

**Expected output:** The `handleSend` function and page state are updated to:
1. Read the `agent` field from each API response and update `currentAgent` state
2. Pass `currentAgent` to the `ChatWindow` and `AgentIndicator` components
3. The UI immediately reflects agent changes: when the API returns a response from a different agent, the indicator updates

No additional logic is needed — the state management from Sprint 1 should handle this if `currentAgent` is already a state variable. Verify and fix if needed.

**Success criterion:** During a conversation where the user transitions from Discovery to Sales, the AgentIndicator at the top changes from "ROVE Discovery" (purple) to "ROVE Sales" (orange) immediately when the Sales response arrives. Each message in the history shows the correct agent label.

---

### [x] Task 3.7 — End-to-end verification of Sprint 3

**Files involved:** All files created/modified in this sprint.

**Required input:** All previous tasks completed.

**Expected output:** No new files. This is a verification task.

**Success criterion:** ALL of the following are true:
1. `npm run dev` starts without errors
2. A new conversation starts with Discovery (purple indicator)
3. After providing budget + preferences + destination interest, the Manager routes to Sales (orange indicator)
4. Typing "Ho un problema con la mia prenotazione" routes to Support (green indicator)
5. The agent indicator changes name and color correctly on every switch
6. Each message in the history shows the correct agent label
7. If the LLM provider is temporarily unreachable (test by using an invalid API key temporarily), the API returns a 500 error with a user-friendly Italian message — it does NOT crash
8. The Manager call adds minimal latency (< 2 seconds for the routing decision)
9. No TypeScript compilation errors (`npx tsc --noEmit` passes)
