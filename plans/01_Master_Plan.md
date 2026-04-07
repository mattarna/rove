# ROVE Chatbot Agent - Master Plan

> **What is this document:** The development Master Plan for the ROVE chatbot, structured in 6 sprints with explicit dependencies. Each sprint has a clear objective, a verifiable output, and the specific risks from the Risk & Constraints Report that it mitigates. This plan was built from: Project Brief (`docs/01_Master_Brief.md`), Risk & Constraints Report (`docs/02_Risk_and_Constraints.md`), IDE Rules (`.antigravity/rules.md`).

---

## [x] Sprint 1 — Foundation + Chat Shell

**Objective:** Create the Next.js project, install all dependencies, build the basic chat interface, and create the API route that returns a hardcoded response. At the end of this sprint, the student sees a working chat in the browser.

**Verifiable output:**
- `npm run dev` starts the server without errors
- The page at `http://localhost:3000` shows a chat interface with an input field and a send button
- The user can type a message and receive a hardcoded response ("Ciao! Sono ROVE Discovery...")
- Messages appear in a scrollable list with visual distinction between user and assistant

**Dependencies:** None.

**Specific risks:**
- **R5 (API key exposed):** Mitigated in this sprint by creating `.env.local` and verifying it is listed in `.gitignore`
- **R4 (Streaming misconfigured):** Not yet relevant — this sprint uses hardcoded responses; streaming is added in Sprint 5

**Complexity estimate:** LOW

---

## [x] Sprint 2 — Knowledge Base + LLM Integration (Discovery)

**Objective:** Build the Knowledge Base loading system, configure the multi-provider LLM client, and make the Discovery agent work with real AI model responses. At the end of this sprint, the chatbot responds as ROVE Discovery using the Shared KB and the Discovery KB.

**Verifiable output:**
- The file `/lib/kb.ts` correctly reads `.md` files from `/docs/`
- The file `/lib/llm-client.ts` exposes `getManagerModel()` and `getAgentModel()` for the chosen provider
- The API route calls the LLM with Discovery system prompt + Shared KB + Discovery KB + conversation history
- The user types "Ciao, vorrei organizzare un viaggio" and receives a response in Italian consistent with the Discovery persona (qualification questions, no prices)
- The response comes from the real LLM, not hardcoded

**Dependencies:** Sprint 1.

**Specific risks:**
- **R1 (Context window overflow):** Mitigated by implementing `truncateHistory()` that truncates to the last 20 messages. Optional enhancement: context-aware truncation that preserves the first message if it contains core user preferences while trimming middle turns.
- **R5 (API key exposed):** Mitigated by verifying the key is read from `process.env` and never exposed to the client

**Complexity estimate:** MEDIUM

---

## [x] Sprint 3 — Manager Agent + Routing

**Objective:** Implement the Manager Agent that classifies user intent and routes to the correct specialist agent. At the end of this sprint, the chatbot has the double LLM call architecture (Manager + Agent) and the UI shows which agent is speaking.

**Verifiable output:**
- The file `/lib/manager.ts` calls the LLM in JSON mode and returns `{ agent: "discovery"|"sales"|"support", reason: "..." }`
- The API route executes two sequential LLM calls: Manager (routing) then Agent (response)
- If the user says "Quanto costa un viaggio alle Maldive?" after providing budget and preferences, the Manager switches to Sales
- If the user says "Ho un problema con la mia prenotazione", the Manager switches to Support
- The UI badge changes name and color based on the active agent (Discovery: purple `#6475FA`, Sales: orange `#E8650A`, Support: green `#22C55E`)
- If the Manager call fails (API error), the system stays on the current agent (fallback)

**Dependencies:** Sprint 2.

**Specific risks:**
- **R2 (Inconsistent routing):** CRITICAL. Mitigated by using JSON mode for deterministic output. The Manager always receives `current_agent` and has an explicit rule not to change agent without a clear signal. Includes a `safeParseManagerResponse()` function that handles LLM hallucination around JSON (e.g., markdown fences, preamble text): tries `JSON.parse` first, falls back to regex extraction of `{...}`, then defaults to `current_agent`.
- **R3 (Double call latency):** Mitigated by using the fastest available model for the Manager (Haiku/Flash/4o-mini). Streaming for the agent response is added in Sprint 5.

**Complexity estimate:** HIGH

---

## [x] Sprint 4 — All Agents + Vertical KBs

**Objective:** Activate the Sales and Support agents with their respective system prompts and vertical Knowledge Bases. At the end of this sprint, all 3 agents are functional and routing between them works correctly.

**Verifiable output:**
- Sales responds with real packages and prices from the KB (e.g., "COMO Cocoa: 8,200 euro for 7 nights")
- Sales uses urgency and upsell techniques consistent with the Sales KB
- Support responds with operational procedures (e.g., "Volo cancellato? Sto contattando la compagnia aerea...")
- Support asks for existing booking confirmation when unclear
- Complete routing test:
  1. Discovery qualifies then hands off to Sales (works)
  2. First message mentions a problem then Discovery asks booking confirmation then Support activates (works)
  3. User in Sales asks about a problem then Support activates then returns to Sales (works)
  4. User in Sales asks about a new destination then stays in Sales without switching (works)

**Dependencies:** Sprint 3.

**Specific risks:**
- **R2 (Inconsistent routing):** Validation of all routing paths. If an edge case fails, the issue is in the Manager prompt, not in the code.
- **R1 (Context window overflow):** With 3 active agents, the total context (system prompt + Shared KB + Vertical KB + history) must fit within limits. Verify the total does not exceed ~15,000 tokens.

**Complexity estimate:** MEDIUM

---

## [x] Sprint 5 — Streaming + UX Polish

**Objective:** Enable response streaming, add the welcome message, loading state, auto-scroll, user-friendly error handling, and mobile responsiveness. At the end of this sprint, the chatbot has production-quality UX.

**Verifiable output:**
- Agent responses appear word by word (streaming), not all at once
- On page load, a welcome message from Discovery appears: "Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto..."
- Phase-aware loading: the UI shows "Analyzing your request..." during the Manager routing call, then transitions to the agent badge + streaming indicator once the specialist starts generating
- The chat auto-scrolls to the bottom when a new message arrives
- If the API call fails, the user sees: "Mi scuso, ho un problema tecnico. Riprova tra un momento."
- The interface is usable on mobile (responsive)
- No debug `console.log` statements remain in the code

**Dependencies:** Sprint 4.

**Specific risks:**
- **R4 (Streaming not supported):** Mitigated by using Vercel AI SDK `streamText` + `useChat` hook. If streaming fails, fallback to complete (non-streaming) response.
- **R3 (Double call latency):** The user sees the message appear progressively thanks to streaming, reducing perceived wait time.

**Complexity estimate:** MEDIUM

---

## [x] Sprint 6 — Deploy to Vercel

**Objective:** Deploy the chatbot to Vercel with a working public URL. At the end of this sprint, anyone can open the URL and interact with the ROVE chatbot.

**Verifiable output:**
- `npm run build` completes without errors
- The project is pushed to a Git repository (GitHub)
- The project is deployed to Vercel via Git integration
- The environment variable (API key) is configured in the Vercel dashboard
- The public URL (e.g., `rove-chatbot.vercel.app`) loads the chatbot
- The chatbot works end-to-end on the public URL: Discovery qualifies then Sales presents packages then Support handles problems
- No API keys are exposed in the Git repository

**Dependencies:** Sprint 5.

**Specific risks:**
- **R5 (API key exposed):** Final verification that `.env.local` is NOT in the repository. The key is configured in the Vercel dashboard under "Environment Variables".
- **Vercel timeout:** Serverless functions have a 10s timeout on the free tier. If the double LLM call exceeds 10s, increase the timeout to 30s in the Vercel config or in `vercel.json`.

**Complexity estimate:** LOW

---

## Risk Coverage Summary

| Risk | Severity | Mitigation Sprint(s) |
|------|----------|---------------------|
| R1 — Context window overflow | MEDIUM | Sprint 2 (truncateHistory), Sprint 4 (total token verification) |
| R2 — Inconsistent Manager routing | CRITICAL | Sprint 3 (JSON mode + fallback), Sprint 4 (full routing test) |
| R3 — Double call latency | MEDIUM | Sprint 3 (fast model for Manager), Sprint 5 (streaming) |
| R4 — Streaming misconfigured | MEDIUM | Sprint 5 (Vercel AI SDK + fallback) |
| R5 — API key exposed | CRITICAL | Sprint 1 (.env.local + .gitignore), Sprint 2 (process.env), Sprint 6 (final verification) |
