# Response to CTO Fix Plan — Streaming & Frozen Typing

**From Matt | April 7, 2026**

---

## Your diagnosis is correct, but the files are incomplete

Your analysis of the stream format mismatch and typing indicator logic is accurate. However, there's a prerequisite problem: **5 source files are physically truncated**. They end mid-line, mid-expression. This isn't a display issue — the files are genuinely incomplete on disk.

Until these files are completed, the streaming fixes you described have nowhere to land.

### Proof — last line of each file:

| File | Lines | Ends at (literal last characters) |
|------|-------|-----------------------------------|
| `app/page.tsx` | 56 | `headers: { 'Content-Type':` |
| `app/api/chat/route.ts` | 30 | `cleanMessages = truncatedMessages.map(({ role, content }) => ({` then `role:` |
| `components/ChatWindow.tsx` | 35 | `className="p-1.5 hover:bg-` |
| `components/MessageBubble.tsx` | 20 | `` ${isUser`` |
| `lib/prompts.ts` | 29 | `- You are in a CHAT, not writing an email.` (mid-template literal, no closing backtick, no return statement) |

Every file ends without closing braces, without return statements, without complete JSX. These files cannot compile as-is.

---

## What this means for your plan

Your fixes A through D are the right fixes, but they assume the code exists. Here's the mapping:

### Fix A (Client stream reader) — Cannot be applied
`page.tsx` ends at line 56 before the fetch body is even complete. The `0:` / newline parser you want to replace doesn't exist in this file — the code never gets that far. **The entire `handleSend` function body needs to be written first**, then your plain-text `reader.read()` + `TextDecoder` pattern goes in as the implementation (not a refactor).

### Fix B (Typing indicator) — Cannot be applied
`ChatWindow.tsx` ends at line 35 mid-className. The typing indicator condition on lines 58-59 that you referenced doesn't exist — the file never reaches the message rendering loop. **The component needs to be completed first**, and when it is, implement the typing condition as `loadingPhase === 'generating'` only (as you suggest), not the empty-content fallback.

### Fix C (Manager short-circuit) — Can be applied now
`lib/manager.ts` is complete (102 lines, fully functional). This optimization can be added independently.

### Fix D (AbortSignal + timeout) — Cannot be applied
Depends on `page.tsx` having a complete `handleSend` function.

---

## Recommended sequence

### Step 0: Complete the 5 truncated files (BLOCKER — 2-3 hours)

These files need to be finished before anything else. When completing them, build in your fixes directly rather than writing placeholder code and then refactoring:

**`lib/prompts.ts`** — Complete the formatting instruction template literal, close it, concatenate all parts, add return statement. Without this, the agent has no system prompt. This is why Discovery gave a dead-end response ("Capisco! A volte è difficile scegliere con così tante opzioni") — it has no instructions to follow the 3-question qualification flow.

**`app/api/chat/route.ts`** — Complete the `cleanMessages` map, call `streamText()` with `toTextStreamResponse()`, include `X-Agent` header. Build streaming correctly from the start.

**`app/page.tsx`** — Complete `handleSend` with your Fix A pattern directly: plain `reader.read()` + `TextDecoder({ stream: true })`, append chunks to last assistant message, no `0:` protocol parsing. Add AbortSignal (Fix D) while you're in there.

**`components/ChatWindow.tsx`** — Complete the reset button, message rendering loop, and typing indicator. Use `loadingPhase === 'generating'` only (Fix B) from the start.

**`components/MessageBubble.tsx`** — Complete the JSX, add markdown rendering with ReactMarkdown (already imported), add parsing for ` ```package ``` ` and ` ```comparison ``` ` blocks to render PackageCard and ComparisonTable components (both already built and complete).

### Step 1: Apply Fix C (Manager short-circuit) — Optional, 1 hour
Add keyword-based bypass in `manager.ts` or at top of route. Good optimization, not blocking.

### Step 2: Verify
- One-word message: text appears within 1-2s
- Wrong API key: error message, not infinite spinner
- Page reload: session restored from sessionStorage

---

## Summary

The plan is right. The code isn't there yet to receive it. Complete the 5 files first, baking in fixes A, B, and D as you go. Then layer on Fix C as an optimization pass.

Total estimated effort: 3-4 hours including all fixes.
