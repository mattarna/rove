# Sub-Plan — Sprint 4: All Agents + Vertical KBs

> **What is this document:** The detailed Sub-Plan for Sprint 4 of the ROVE chatbot Master Plan. This sprint activates the Sales and Support agents and validates all routing paths. At the end, the full multi-agent system is operational.

**Sprint Objective:** Activate the Sales and Support agents with their respective system prompts and vertical Knowledge Bases. At the end of this sprint, all 3 agents are functional and routing between them works correctly.

**Estimated Time:** ~30 minutes

**Dependencies:** Sprint 3 completed.

**Risks Mitigated:** R2 (Inconsistent routing — full path validation), R1 (Context window overflow — token verification)

---

### [x] Task 4.1 — Verify Sales and Support prompt files are accessible

**Files involved:** `/docs/06_Sales_Prompt.md`, `/docs/07_Sales_KB.md`, `/docs/08_Support_Prompt.md`, `/docs/09_Support_KB.md`

**Required input:** Sprint 3 completed. The `/lib/kb.ts` loader and `/lib/prompts.ts` mapper exist.

**Expected output:** No new files. This is a verification task to confirm that `getAgentSystemPrompt('sales')` and `getAgentSystemPrompt('support')` return correctly assembled prompts.

**Success criterion:**
- `getAgentSystemPrompt('sales')` returns a string containing:
  - Sales system prompt content (includes "convert qualified prospects into confirmed bookings")
  - Shared KB content (includes "IDENTITY & BRAND")
  - Sales vertical KB content (includes "Urgency Patterns")
- `getAgentSystemPrompt('support')` returns a string containing:
  - Support system prompt content (includes "resolve operational issues")
  - Shared KB content (includes "IDENTITY & BRAND")
  - Support vertical KB content (includes "Operational Procedures")
- Neither returns an empty string or throws an error

**Verification method:** Add a temporary test in the API route or run via a script:
```typescript
console.log('Sales prompt length:', getAgentSystemPrompt('sales').length);
console.log('Support prompt length:', getAgentSystemPrompt('support').length);
```
Both should return non-zero values. Remove the test code after verification.

---

### [x] Task 4.2 — Verify agents.ts configuration covers all three agents

**Files involved:** `/lib/agents.ts` (verify, modify if needed)

**Required input:** Task 2.4 completed (agents.ts exists).

**Expected output:** Confirm that `/lib/agents.ts` includes complete configuration for all three agents:
- `AGENT_COLORS` has entries for `discovery`, `sales`, and `support`
- `AGENT_DISPLAY_NAMES` has entries for all three
- `isValidAgent()` recognizes all three names

If any are missing, add them.

**Success criterion:** `AGENT_COLORS.sales` returns `'#E8650A'`. `AGENT_DISPLAY_NAMES.support` returns `'ROVE Support'`. `isValidAgent('support')` returns `true`.

---

### [x] Task 4.3 — Test routing path: Discovery qualifies then hands off to Sales

**Files involved:** No file changes. Testing via the running application.

**Required input:** All previous tasks completed. The application is running on `http://localhost:3000`.

**Expected output:** No file changes. This is a manual test.

**Test conversation:**
1. User: "Ciao, vorrei organizzare un viaggio"
   - Expected: Discovery responds, asks about travel preferences
2. User: "Budget circa 6000 euro a persona, siamo una coppia, vorremmo relax al mare"
   - Expected: Discovery responds, recommends Maldive, asks if interested
3. User: "Si, le Maldive! Quali resort avete? Quanto costano?"
   - Expected: Manager routes to Sales. Agent indicator changes to "ROVE Sales" (orange). Sales responds with specific packages and prices from the KB (COMO Cocoa, Kagi, Baglioni, etc.)

**Success criterion:**
- The agent switches from Discovery to Sales after the user has been qualified (budget + style + group stated)
- Sales mentions real prices from the KB (e.g., "COMO Cocoa: €8.200 per 7 notti")
- Sales does NOT repeat the Discovery qualification questions
- The UI shows "ROVE Sales" with the orange indicator after the switch

---

### [x] Task 4.4 — Test routing path: User mentions existing booking goes to Support

**Files involved:** No file changes. Testing via the running application.

**Required input:** Fresh page reload (new conversation).

**Test conversation:**
1. User: "Ho un problema con la mia prenotazione alle Maldive. Il volo e stato cancellato."
   - Expected: Since this is the first message and there is no booking history, Manager should route to Discovery. Discovery asks "Hai gia prenotato un viaggio con noi?" per the Manager prompt edge case rules.
2. User: "Si, ho gia prenotato e pagato. Parto tra 5 giorni."
   - Expected: Manager routes to Support. Agent indicator changes to "ROVE Support" (green). Support responds with operational procedure for cancelled flights.

**Success criterion:**
- First message goes to Discovery (not directly to Support, per the Manager prompt's "Support on first message" rule)
- After confirmation of existing booking, the agent switches to Support
- Support responds with the flight cancellation procedure (contact airline, 24hr update, hotel/meals if delayed)
- The UI shows "ROVE Support" with the green indicator

---

### [x] Task 4.5 — Test routing path: Sales to Support and back

**Files involved:** No file changes. Testing via the running application.

**Required input:** An active conversation that has reached Sales (use the flow from Task 4.3).

**Test conversation (continuing from Task 4.3):**
4. User: "A proposito, ho anche una prenotazione precedente con un problema all'hotel. Possono aiutarmi?"
   - Expected: Manager routes to Support. Agent indicator changes to green.
5. User: "Ok grazie, il problema con l'hotel si e risolto. Torniamo alle Maldive, quale resort mi consigli?"
   - Expected: Manager routes back to Sales. Agent indicator changes back to orange.

**Success criterion:**
- Mid-Sales conversation, a support question triggers switch to Support
- When the user returns to the sales topic, Manager routes back to Sales
- The conversation maintains coherence across agent switches

---

### [x] Task 4.6 — Test edge case: User in Sales asks about new destination

**Files involved:** No file changes. Testing via the running application.

**Required input:** An active conversation in Sales discussing Maldive.

**Test conversation (continuing):**
- User: "E l'Egitto? Avete qualcosa sul Nilo?"
   - Expected: Manager stays in Sales (per the Manager prompt rule: "if user asks a tangential question while in Sales, stay in Sales unless the user explicitly signals a new trip with different budget, dates, or group composition")

**Success criterion:**
- The agent stays in Sales (does NOT switch to Discovery)
- Sales responds with Egypt/Nile package information from the KB
- The agent indicator remains "ROVE Sales" (orange)

---

### [x] Task 4.7 — Verify total context size stays within limits

**Files involved:** `/app/api/chat/route.ts` (add temporary logging)

**Required input:** All previous tasks completed.

**Expected output:** Add temporary logging to the API route to measure the total prompt size:
```typescript
const systemPrompt = getAgentSystemPrompt(selectedAgent);
const truncatedHistory = truncateHistory(messages, 20);
const totalChars = systemPrompt.length + JSON.stringify(truncatedHistory).length;
console.log(`Total context: ~${Math.round(totalChars / 4)} tokens (${selectedAgent})`);
```

Run a conversation with each agent and check the logged token counts.

**Success criterion:**
- Discovery context (prompt + KB + 20 messages): under 15,000 tokens
- Sales context (prompt + KB + 20 messages): under 15,000 tokens
- Support context (prompt + KB + 20 messages): under 15,000 tokens
- If any exceeds the limit, reduce `maxLength` in `truncateHistory` or identify which KB section is too long

Remove the temporary logging after verification.

---

### [x] Task 4.8 — End-to-end verification of Sprint 4

**Files involved:** All files from this sprint.

**Required input:** All previous tasks completed.

**Expected output:** No new files. This is a comprehensive verification task.

**Success criterion:** ALL of the following are true:
1. All 3 agents respond with correct knowledge from their respective KBs
2. Discovery qualifies without mentioning prices
3. Sales quotes real prices from the Shared KB
4. Support follows operational procedures from the Support KB
5. All 4 routing paths work correctly (Tasks 4.3 through 4.6)
6. Agent indicator changes name and color on every switch
7. Total context stays within token limits for all agents
8. No TypeScript compilation errors (`npx tsc --noEmit` passes)
