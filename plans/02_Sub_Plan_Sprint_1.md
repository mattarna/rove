# Sub-Plan — Sprint 1: Foundation + Chat Shell

> **What is this document:** The detailed Sub-Plan for Sprint 1 of the ROVE chatbot Master Plan. Contains atomic tasks in execution order, each with exact file paths, inputs, outputs, and verifiable success criteria. Designed to be executed by an AI-assisted IDE (AntiGravity, Cursor, Claude Code) task by task.

**Sprint Objective:** Create the Next.js project, install all dependencies, build the basic chat interface, and create the API route that returns a hardcoded response. At the end of this sprint, the student sees a working chat in the browser.

**Estimated Time:** ~30 minutes

**Risks Mitigated:** R5 (API key exposed)

---

### [x] Task 1.1 — Create Next.js project with App Router

**Files involved:** Project root (all scaffolded files)

**Required input:** Node.js and npm installed on the machine.

**Expected output:** A new Next.js project directory with App Router structure (`/app` directory, not `/pages`). The project includes `package.json`, `next.config.js` (or `.mjs`), `/app/layout.tsx`, `/app/page.tsx`, `/app/globals.css`.

**Success criterion:** Running `npm run dev` starts the development server on `http://localhost:3000` and the default Next.js welcome page renders in the browser without errors.

**IDE instruction:**
```bash
npx create-next-app@latest rove-chatbot --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```
If the project is being created inside the current directory (already named `rove-chatbot`), use `.` instead of `rove-chatbot`.

---

### [x] Task 1.2 — Install project dependencies

**Files involved:** `package.json`

**Required input:** Task 1.1 completed. The Next.js project exists with a valid `package.json`.

**Expected output:** The following packages are added to `package.json` dependencies:
- `ai` (Vercel AI SDK)
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
- `@ai-sdk/openai`

**Success criterion:** Running `npm ls ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai` shows all four packages installed without errors.

**IDE instruction:**
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
```

---

### [x] Task 1.3 — Create shared TypeScript types

**Files involved:** `/lib/types.ts` (create new)

**Required input:** Task 1.1 completed.

**Expected output:** A file at `/lib/types.ts` that exports the following types:

```typescript
export type AgentName = 'discovery' | 'sales' | 'support';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentName;
}

export interface ManagerResponse {
  agent: AgentName;
  reason: string;
}

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  color: string;
  promptFile: string;
  kbFile: string;
}
```

**Success criterion:** The file exists at `/lib/types.ts`, compiles without TypeScript errors, and exports all five types listed above.

---

### [x] Task 1.4 — Create .env.local template and verify .gitignore

**Files involved:** `/.env.local` (create new), `/.gitignore` (verify)

**Required input:** Task 1.1 completed.

**Expected output:**
1. A file `/.env.local` with placeholder content:
```
# Uncomment ONE provider and add your API key

# ANTHROPIC_API_KEY=sk-ant-your-key-here
# GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
# OPENAI_API_KEY=sk-your-key-here
```
2. The file `/.gitignore` contains `.env.local` (Next.js includes this by default, but verify).

**Success criterion:** The file `/.env.local` exists with placeholder content. Running `grep ".env.local" .gitignore` returns a match. The `.env.local` file will NOT appear in `git status` after running `git init && git add -A`.

---

### [x] Task 1.5 — Create the root layout

**Files involved:** `/app/layout.tsx` (modify existing)

**Required input:** Task 1.1 completed.

**Expected output:** The root layout includes:
- HTML lang set to `it` (Italian)
- Page title: "ROVE - L'Astrolabio AI Assistant"
- Meta description: "AI-powered travel assistant for L'Astrolabio premium travel consultancy"
- Body with `min-h-screen` and a neutral background (e.g., `bg-gray-50`)

**Success criterion:** The page at `http://localhost:3000` renders with the correct title in the browser tab ("ROVE - L'Astrolabio AI Assistant") and a light gray background.

---

### [x] Task 1.6 — Create the ChatInput component

**Files involved:** `/components/ChatInput.tsx` (create new)

**Required input:** Task 1.3 completed (types available).

**Expected output:** A client component (`'use client'`) that renders:
- A text input field with placeholder "Scrivi un messaggio..."
- A send button (text or icon)
- The component accepts props: `onSend: (message: string) => void` and `isLoading: boolean`
- When `isLoading` is true, the input is disabled and the button shows a disabled state
- Pressing Enter or clicking the button calls `onSend` with the input value and clears the input
- Empty messages are not sent

**Success criterion:** The component renders in the browser. Typing text and pressing Enter calls the `onSend` callback with the typed text. The input clears after sending. Empty submissions are blocked.

---

### [x] Task 1.7 — Create the MessageBubble component

**Files involved:** `/components/MessageBubble.tsx` (create new)

**Required input:** Task 1.3 completed (types available).

**Expected output:** A client component that renders a single chat message. It accepts a `ChatMessage` prop and renders:
- User messages: right-aligned, with a distinct background color (e.g., blue/indigo)
- Assistant messages: left-aligned, with a neutral background (e.g., white or light gray)
- The message text is displayed with proper whitespace handling (`whitespace-pre-wrap`)
- If the message has an `agent` field, it displays the agent name above the message in a small label

**Success criterion:** Given a user message `{ role: "user", content: "Ciao" }`, it renders right-aligned with blue background. Given an assistant message `{ role: "assistant", content: "Benvenuto!", agent: "discovery" }`, it renders left-aligned with a neutral background and "ROVE Discovery" label above it.

---

### [x] Task 1.8 — Create the AgentIndicator component

**Files involved:** `/components/AgentIndicator.tsx` (create new)

**Required input:** Task 1.3 completed (types available).

**Expected output:** A client component that shows the currently active agent. It accepts `agentName: AgentName` as a prop and renders:
- A colored dot (circle) using the agent's color (`#6475FA` for discovery, `#E8650A` for sales, `#22C55E` for support)
- The agent display name next to it ("ROVE Discovery", "ROVE Sales", "ROVE Support")
- The component uses the agent color and name maps defined inline or imported from a constants object

**Success criterion:** Given `agentName="discovery"`, it renders a purple dot and the text "ROVE Discovery". Given `agentName="sales"`, it renders an orange dot and the text "ROVE Sales".

---

### [x] Task 1.9 — Create the ChatWindow component

**Files involved:** `/components/ChatWindow.tsx` (create new)

**Required input:** Tasks 1.6, 1.7, 1.8 completed (ChatInput, MessageBubble, AgentIndicator exist).

**Expected output:** A client component (`'use client'`) that assembles the full chat interface:
- A header area showing the AgentIndicator for the current agent
- A scrollable message area that renders a MessageBubble for each message in the `messages` array
- The ChatInput component at the bottom
- The component accepts props:
  - `messages: ChatMessage[]`
  - `currentAgent: AgentName`
  - `isLoading: boolean`
  - `onSend: (message: string) => void`
- Layout: full-height container with flex column, messages area grows to fill available space, input stays fixed at the bottom

**Success criterion:** The component renders a complete chat layout. The agent indicator shows at the top. Messages are scrollable in the middle. The input is fixed at the bottom. The layout fills the viewport height.

---

### [x] Task 1.10 — Create the API route with hardcoded response

**Files involved:** `/app/api/chat/route.ts` (create new)

**Required input:** Task 1.3 completed (types available).

**Expected output:** A POST API route at `/api/chat` that:
1. Reads `messages` (array) and `currentAgent` (string or null) from the request body
2. Validates that `messages` exists and is an array; returns status 400 if not
3. Returns a JSON response with:
```json
{
  "agent": "discovery",
  "message": "Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto. Dimmi, che tipo di esperienza stai sognando?",
  "color": "#6475FA"
}
```
4. The response is hardcoded for now — no LLM call

**Success criterion:** Sending a POST request to `http://localhost:3000/api/chat` with body `{ "messages": [{ "role": "user", "content": "Ciao" }], "currentAgent": null }` returns status 200 with the hardcoded JSON response. Sending a POST with missing `messages` returns status 400.

**Verification command:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Ciao"}],"currentAgent":null}'
```

---

### [x] Task 1.11 — Create the main page with chat state and API integration

**Files involved:** `/app/page.tsx` (modify existing)

**Required input:** Tasks 1.9 and 1.10 completed (ChatWindow component and API route exist).

**Expected output:** The main page component that:
1. Uses `'use client'` directive
2. Manages state with `useState`:
   - `messages: ChatMessage[]` — starts empty
   - `currentAgent: AgentName` — starts as `'discovery'`
   - `isLoading: boolean` — starts as `false`
3. Implements a `handleSend` function that:
   - Adds the user message to `messages` state
   - Sets `isLoading` to `true`
   - Calls `POST /api/chat` with `{ messages, currentAgent }`
   - On response, adds the assistant message to `messages` state with the `agent` field
   - Updates `currentAgent` from the response
   - Sets `isLoading` to `false`
   - Wraps the fetch in try/catch; on error, adds an error message in Italian
4. Renders the ChatWindow with all state and the handleSend callback
5. Centers the chat in the page with a max-width container (e.g., `max-w-2xl mx-auto`)

**Success criterion:** Opening `http://localhost:3000` shows the chat interface. Typing "Ciao" and pressing Enter adds the user message to the chat, shows a brief loading state, then adds the hardcoded assistant response below it. The agent indicator shows "ROVE Discovery" with the purple dot. Multiple messages can be sent and all appear in the scrollable list.

---

### [x] Task 1.12 — End-to-end verification of Sprint 1

**Files involved:** All files created in this sprint.

**Required input:** All previous tasks completed.

**Expected output:** No new files. This is a verification task.

**Success criterion:** ALL of the following are true:
1. `npm run dev` starts without errors
2. `http://localhost:3000` shows a chat interface with input field and send button
3. The browser tab title shows "ROVE - L'Astrolabio AI Assistant"
4. The agent indicator at the top shows "ROVE Discovery" with a purple dot
5. The user can type a message and receive the hardcoded Discovery response
6. User messages appear right-aligned; assistant messages appear left-aligned
7. The message list is scrollable
8. The input clears after sending
9. `.env.local` exists and is in `.gitignore`
10. No TypeScript compilation errors (`npx tsc --noEmit` passes)
