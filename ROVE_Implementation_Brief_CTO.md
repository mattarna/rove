# ROVE CHATBOT AGENT — Implementation Brief

**Prepared by Matt | April 7, 2026 | For: CTO / Dev Team**

---

## 1. Current Status: What Is Broken

The ROVE Discovery agent is currently non-functional in production. Two distinct issues are causing the failure.

### 1.1 Deprecated Model

**File:** `lib/llm-client.ts` (lines 10-11)

Both `getManagerModel()` and `getAgentModel()` point to `gemini-1.5-flash`, which Google has removed from the v1beta API. This is the error users see in the chat interface.

**Fix:** Replace with current model names:

```ts
export const getManagerModel = () => google('gemini-2.0-flash');
export const getAgentModel = () => google('gemini-2.5-flash');
```

**Effort:** 5 minutes. Single file, two lines.

### 1.2 Four Truncated Source Files

These files are cut off mid-function with no closing brackets or return statements. They were likely truncated during an editing session or a bad commit. The Master Plan marks all 6 sprints as completed, but the code does not reflect that state.

| File | Lines | What Is Missing |
|------|-------|-----------------|
| `app/api/chat/route.ts` | 29 | Only has Manager routing call. Missing entirely: agent execution, LLM call, system prompt loading, and response return. This is the primary reason the chatbot returns nothing. |
| `lib/prompts.ts` | ~30 | `getAgentSystemPrompt()` stops mid-template literal. No return statement. The agent never receives its system prompt or knowledge base. |
| `app/page.tsx` | 56 | Error handler and render block incomplete. Component cannot render the ChatWindow properly. |
| `components/ChatWindow.tsx` | 33 | JSX cuts off before the message rendering loop and ChatInput component binding. |

**Effort:** 1-2 hours for a developer familiar with the project. All four files need to be completed following the existing architecture documented in `docs/` and `.antigravity/rules.md`.

### 1.3 What Works

- All 10 knowledge base documents are complete and well-structured (STARS framework)
- TypeScript type system is solid (AgentName, ChatMessage, ManagerResponse, AgentConfig)
- Manager routing logic with multi-level fallback parsing is fully implemented
- Multi-agent architecture is sound and well-documented
- Vercel deployment configuration is in place (30s timeout for /api/chat)
- All three LLM provider SDKs are installed and ready (Anthropic, Google, OpenAI)

---

## 2. Feature Roadmap: 4 Improvements

Once the bug fixes are deployed, the following four features should be implemented in order. All are frontend-focused with minimal or zero backend changes required.

---

### 2.1 Conversation Persistence (sessionStorage)

| Complexity | Effort | Backend Changes | Dependencies |
|------------|--------|-----------------|--------------|
| **Low** | 1-2 hours | None | None |

**Problem:** Currently the conversation lives in React state only. If the user refreshes the page or accidentally closes the tab, the entire conversation is lost. For a travel consultation that can last 10-15 messages, this is a significant friction point.

**Solution:** Use sessionStorage to persist the messages array and currentAgent state. On every new message, save to sessionStorage. On page load, check for existing session data and restore it.

**Implementation Details**

**File:** `app/page.tsx`

- Add a useEffect that saves `messages[]` and `currentAgent` to sessionStorage on every state change
- Add initialization logic in useState that reads from sessionStorage first, falls back to welcome message
- Add a `"New Conversation"` button that clears sessionStorage and resets state

Key code pattern:

```ts
// On every message update
useEffect(() => {
  sessionStorage.setItem('rove-messages', JSON.stringify(messages));
  sessionStorage.setItem('rove-agent', currentAgent);
}, [messages, currentAgent]);

// On initialization
const [messages, setMessages] = useState(() => {
  const saved = sessionStorage.getItem('rove-messages');
  return saved ? JSON.parse(saved) : [welcomeMessage];
});
```

**Scope:** ~20 lines of code in a single file. No backend changes. No new dependencies.

---

### 2.2 Typing Indicator + Agent Transition Animation

| Complexity | Effort | Backend Changes | Dependencies |
|------------|--------|-----------------|--------------|
| **Low** | 2-3 hours | None | None (CSS only) |

**Problem:** The Manager routing call adds latency before the agent responds. During this time, the user sees nothing. Dead air in a chat interface feels broken, even if it is only 1-2 seconds. Additionally, when the agent switches (Discovery to Sales, for example), the transition is abrupt with no visual feedback.

**Solution:** Two components working together.

**Component A: Typing Indicator**

**New file:** `components/TypingIndicator.tsx`

- Animated three-dot bubble that appears in the message stream while waiting for a response
- Shows `"ROVE sta pensando..."` text below the dots
- Uses the current agent color for the dots
- Triggered by the existing `loadingPhase` state (already in page.tsx, just not wired to UI)

**Component B: Agent Transition Animation**

**File:** `components/AgentIndicator.tsx` (modify existing)

- When currentAgent changes, animate the name and color badge with a CSS transition (fade out old, fade in new)
- Duration: 300ms ease-in-out
- Optional: brief flash/pulse effect on the badge to draw attention to the switch

**Wiring:** In ChatWindow.tsx, render `<TypingIndicator />` as the last item in the message list when `loadingPhase !== 'idle'`. Auto-scroll to keep it visible.

**Scope:** 1 new component (~30 lines), 1 modified component, CSS animations. No backend changes.

---

### 2.3 Rich Package Cards

| Complexity | Effort | Backend Changes | Dependencies |
|------------|--------|-----------------|--------------|
| **Low-Medium** | 2-3 hours | Prompt update only | None |

**Problem:** When the Sales agent presents travel packages, it does so in plain text paragraphs. The user has to mentally parse destination names, prices, durations, and included features from a wall of text. This reduces comprehension and perceived quality of the product.

**Solution:** A PackageCard React component that renders structured package data as a visual card with destination name, price, duration, key features, and a CTA element. The Sales agent outputs package data in a structured JSON format embedded in its response, and the frontend parses and renders it.

**Implementation Details**

**Step 1 — Prompt Update:** Modify `docs/06_Sales_Prompt.md` to instruct the Sales agent to output packages in a specific format:

````
When presenting packages, output each one in this exact format:

```package
{
  "name": "COMO Cocoa Island",
  "destination": "Maldive",
  "price": "8.200",
  "duration": "7 notti",
  "highlights": ["Ultra-luxury", "Adults only", "Overwater villa"],
  "cta": "Scopri disponibilita"
}
```
````

**Step 2 — New Component:** `components/PackageCard.tsx`

- Accepts parsed package JSON as props
- Renders: destination badge (color-coded), package name, price with per-person label, duration, feature tags, CTA button
- Responsive design: stacks vertically on mobile, side-by-side on desktop when multiple cards
- Uses Tailwind classes already in the project

**Step 3 — Parser:** In `MessageBubble.tsx`, detect ` ```package``` ` code blocks in the assistant message, parse the JSON, and render `<PackageCard />` instead of plain text for those blocks. The rest of the message renders normally as markdown.

**Data source:** All package data already exists in `03_Shared_KB.md` (destination names, prices, durations, inclusions). The agent already has access to this data. The only change is instructing it to output in the structured format when presenting options.

**Scope:** 1 new component (~60 lines), 1 prompt file update, parsing logic in MessageBubble. No new API calls. No backend route changes.

---

### 2.4 Proactive Destination Comparison Table

| Complexity | Effort | Backend Changes | Dependencies |
|------------|--------|-----------------|--------------|
| **Medium** | 4-6 hours | Prompt update only | None |

**Problem:** When Discovery qualifies a user and identifies 2-3 matching destinations, it describes them sequentially in text. The user has to ask follow-up questions about each destination one by one to compare them. This creates unnecessary back-and-forth and slows down the path to Sales handoff.

**Solution:** A ComparisonTable component that renders a side-by-side comparison of 2-3 destinations when the Discovery agent reaches the mapping phase (after the 3-question qualification). Same pattern as Package Cards: the agent outputs structured data, the frontend renders it visually.

**Implementation Details**

**Step 1 — Prompt Update:** Modify `docs/04_Discovery_Prompt.md` to add a comparison output format at the mapping phase:

````
When you have enough information to suggest destinations, output a comparison:

```comparison
{
  "destinations": [
    {
      "name": "Maldive",
      "match": "95%",
      "priceRange": "5.800 - 14.000",
      "bestFor": "Relax, coppia, luxury",
      "season": "Nov - Apr",
      "whyForYou": "Perfetto per la luna di miele che cercate"
    },
    { ... }
  ]
}
```
````

**Step 2 — New Component:** `components/ComparisonTable.tsx`

- Renders 2-3 destination columns side by side
- Each column: destination name, match percentage (visual bar), price range, best-for tags, season indicator, personalized reason
- Highlight the best match with a subtle border or badge
- Responsive: horizontal scroll or vertical stack on mobile

**Step 3 — Parser:** Same pattern as Package Cards. In `MessageBubble.tsx`, detect ` ```comparison``` ` blocks, parse JSON, render `<ComparisonTable />`.

**Why this is the hardest of the four:** The prompt engineering requires careful calibration. The Discovery agent needs to reliably output the structured format at the right moment in the conversation (after qualification, before handoff), and the match percentage needs to feel accurate. Expect 2-3 iterations of prompt tuning to get the output consistent.

**Scope:** 1 new component (~80 lines), 1 prompt file update, shared parsing logic with Package Cards. No backend route changes.

---

## 3. Implementation Summary

| # | Task | Complexity | Effort | Backend | Priority |
|---|------|-----------|--------|---------|----------|
| 0a | Fix deprecated model (gemini-1.5-flash) | Trivial | 5 min | 1 file | **BLOCKER** |
| 0b | Complete 4 truncated source files | Low | 1-2 hrs | 4 files | **BLOCKER** |
| 1 | Conversation persistence (sessionStorage) | Low | 1-2 hrs | None | **High** |
| 2 | Typing indicator + agent transition | Low | 2-3 hrs | None | **High** |
| 3 | Rich package cards (Sales agent) | Low-Med | 2-3 hrs | Prompt | **Medium** |
| 4 | Proactive destination comparison (Discovery) | Medium | 4-6 hrs | Prompt | **Medium** |

**Total estimated effort:** 11-17 hours of developer time (including bug fixes).

**Recommended sequence:** 0a + 0b first (unblock the agent), then 1 + 2 together (quick UX wins), then 3 + 4 together (rich UI components sharing the same parsing pattern).

### Architecture Note

Features 3 and 4 share an identical frontend pattern: the LLM outputs a fenced code block with a custom language tag (` ```package ` or ` ```comparison `), and `MessageBubble.tsx` parses it and renders a React component instead of plain text. Building a generic `StructuredBlockParser` utility for this pattern means Feature 4 is faster to implement after Feature 3 is done.

No new npm dependencies are required for any of the four features. No database. No new API routes. No changes to `vercel.json` or deployment configuration.
