# Sub-Plan — Sprint 5: Streaming + UX Polish

> **What is this document:** The detailed Sub-Plan for Sprint 5 of the ROVE chatbot Master Plan. This sprint transforms the chatbot from a functional prototype into a production-quality experience by adding streaming, loading states, error handling, and responsive design.

**Sprint Objective:** Enable response streaming, add the welcome message, phase-aware loading states, auto-scroll, user-friendly error handling, and mobile responsiveness. At the end of this sprint, the chatbot has production-quality UX.

**Estimated Time:** ~45 minutes

**Dependencies:** Sprint 4 completed.

**Risks Mitigated:** R4 (Streaming misconfigured), R3 (Double call latency — perceived)

---

### [x] Task 5.1 — Update the API route to stream the Agent response

**Files involved:** `/app/api/chat/route.ts` (modify)

**Required input:** Sprint 4 completed. The API route currently uses `generateText` (non-streaming).

**Expected output:** The API route is updated to:

1. Keep the Manager call as non-streaming (`generateText`) — it returns a small JSON and streaming adds no value
2. Replace the Agent call from `generateText` to `streamText` from the `ai` package
3. The response format changes: instead of returning JSON, the route returns a streaming response using the Vercel AI SDK's `toDataStreamResponse()` method
4. The agent name and color are included as custom headers or as metadata in the stream (using `streamText`'s `onFinish` callback or by prepending metadata)

**Implementation approach:**
```typescript
import { streamText } from 'ai';

// Step 1: Manager routing (non-streaming)
const selectedAgent = await routeMessage(latestMessage, currentAgent, messages);

// Step 2: Agent response (streaming)
const result = streamText({
  model: getAgentModel(),
  system: getAgentSystemPrompt(selectedAgent),
  messages: truncatedMessages,
});

// Return streaming response with agent metadata in headers
return result.toDataStreamResponse({
  headers: {
    'X-Agent-Name': selectedAgent,
    'X-Agent-Color': AGENT_COLORS[selectedAgent],
  },
});
```

Error handling: wrap both calls in try/catch. If the Manager fails, use fallback agent. If the Agent streaming fails, return a non-streaming error response with status 500 and Italian error message.

**Success criterion:** Sending a POST to `/api/chat` returns a streaming response (Transfer-Encoding: chunked or similar). The response headers include `X-Agent-Name` and `X-Agent-Color`. The response body streams text incrementally.

---

### [x] Task 5.2 — Update the frontend to consume streaming responses

**Files involved:** `/app/page.tsx` (modify), `/components/ChatWindow.tsx` (modify if needed)

**Required input:** Task 5.1 completed (API returns streaming response).

**Expected output:** The frontend is updated to handle streaming. Two approaches are valid:

**Option A — useChat hook (recommended if it works cleanly with the double-call architecture):**
```typescript
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  // ... configuration
});
```

**Option B — Manual streaming with fetch (more control, recommended if useChat doesn't fit):**
The `handleSend` function is updated to:
1. Add user message to state
2. Set loading state
3. Fetch `/api/chat` with POST
4. Read `X-Agent-Name` and `X-Agent-Color` from response headers
5. Read the response body as a ReadableStream
6. Progressively append chunks to a growing assistant message in state
7. When the stream ends, finalize the message and clear loading state

The assistant message should appear in the chat and grow character by character (or chunk by chunk) as the stream arrives.

**Success criterion:** When the user sends a message, the assistant's response appears word by word in the chat, not all at once. The streaming effect is visible (text appears progressively over 2-5 seconds for a typical response). The agent indicator updates when the response starts streaming (from the response headers).

---

### [x] Task 5.3 — Implement phase-aware loading states

**Files involved:** `/app/page.tsx` (modify), `/components/ChatWindow.tsx` (modify)

**Required input:** Task 5.2 completed (streaming works).

**Expected output:** Replace the single `isLoading` boolean with a phase-aware state:

```typescript
type LoadingPhase = 'idle' | 'routing' | 'generating';
const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
```

The flow becomes:
1. User sends message → `loadingPhase` set to `'routing'`
2. Manager call completes → `loadingPhase` set to `'generating'`
3. Agent stream starts arriving → `loadingPhase` stays `'generating'` (visible via streaming text)
4. Agent stream completes → `loadingPhase` set to `'idle'`

UI rendering:
- `'routing'`: Show a subtle indicator below the user's message, e.g., a pulsing dot or text "Sto analizzando la tua richiesta..." in gray italic
- `'generating'`: Show the agent indicator (name + color) with a typing/streaming animation, then the text as it arrives
- `'idle'`: No indicator

To implement this, the API route needs to signal the phase transition. Options:
- Send the agent metadata before the stream starts (via headers — already done in Task 5.1)
- The frontend switches from `'routing'` to `'generating'` as soon as it reads the response headers (before any body chunks arrive)

**Success criterion:** When the user sends a message, the UI shows "Sto analizzando la tua richiesta..." for ~1-2 seconds (Manager routing time), then transitions to showing the agent name with streaming text. The transition between phases is smooth, not jarring.

---

### [x] Task 5.4 — Add welcome message on page load

**Files involved:** `/app/page.tsx` (modify)

**Required input:** Task 5.2 completed.

**Expected output:** When the page loads, the chat starts with a pre-populated welcome message from Discovery:

```typescript
const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto. Dimmi, che tipo di esperienza stai sognando?',
  agent: 'discovery',
};

// Initialize messages state with the welcome message
const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
```

The welcome message is NOT sent to the API — it is purely a frontend state initialization. When the user sends their first message, the full `messages` array (including the welcome message) is sent to the API so the LLM has context.

**Success criterion:** Opening `http://localhost:3000` immediately shows a message from "ROVE Discovery" (purple) with the welcome text. The message appears without any loading state or delay. The user can start typing a response immediately.

---

### [x] Task 5.5 — Add auto-scroll on new messages

**Files involved:** `/components/ChatWindow.tsx` (modify)

**Required input:** Task 5.2 completed (streaming works).

**Expected output:** The chat message area automatically scrolls to the bottom when:
1. A new user message is added
2. A new assistant message starts streaming
3. The assistant message grows during streaming (the scroll follows the text)

Implementation: Use a `useRef` on the message container and a `useEffect` that triggers on `messages` state changes:
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```
Place an empty `<div ref={messagesEndRef} />` at the bottom of the messages list.

For streaming: if using manual streaming, the scroll should also trigger on each chunk update (every time the growing message content changes).

**Success criterion:** During a conversation, the user never needs to manually scroll down to see new messages. As the assistant's streaming response grows, the view scrolls to keep the latest text visible. The scroll is smooth, not jumpy.

---

### [x] Task 5.6 — Add user-friendly error handling

**Files involved:** `/app/page.tsx` (modify), `/app/api/chat/route.ts` (verify)

**Required input:** Task 5.2 completed.

**Expected output:** Error handling covers these scenarios:

1. **API route returns 500:** The frontend catches the error and adds an assistant message: `"Mi scuso, ho un problema tecnico. Riprova tra un momento."` with `agent: currentAgent`
2. **Network failure (fetch throws):** Same error message is shown
3. **Stream interrupted mid-response:** The partial response is kept, and no error message is added (the user sees whatever was streamed before the interruption)
4. **Rate limit (429):** Show: `"Il servizio e momentaneamente sovraccarico. Riprova tra qualche secondo."`

All error messages are in Italian. Errors are logged to `console.error` but never shown raw to the user. The `loadingPhase` resets to `'idle'` after any error.

**Success criterion:** Temporarily setting an invalid API key and sending a message shows the Italian error message in the chat (not a JavaScript error, not a blank screen, not a frozen UI). The user can retry by sending another message. The loading state resets after the error.

---

### [x] Task 5.7 — Make the layout mobile responsive

**Files involved:** `/app/page.tsx` (modify), `/components/ChatWindow.tsx` (modify), `/components/ChatInput.tsx` (modify)

**Required input:** All previous tasks completed.

**Expected output:** The chat interface is responsive:
- On desktop (>768px): chat container has `max-w-2xl mx-auto` with comfortable padding
- On mobile (<768px): chat fills the full viewport width with minimal padding (`px-3`)
- The input field does not overflow on small screens
- The send button is always accessible (not hidden behind the keyboard on mobile)
- The agent indicator is readable on small screens (text does not truncate)
- Font sizes scale appropriately (base 14-16px, not too small on mobile)

Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`.

**Success criterion:** Open Chrome DevTools, toggle device toolbar, select "iPhone 12 Pro" (390x844). The chat fills the screen, messages are readable, the input is at the bottom, and the send button is tappable. No horizontal scroll. No overflow.

---

### [x] Task 5.8 — Remove all debug console.log statements

**Files involved:** All `.ts` and `.tsx` files in the project.

**Required input:** All previous tasks completed.

**Expected output:** Search all project files for `console.log` and remove every instance. Keep `console.error` calls that handle actual error conditions (in catch blocks). Remove any temporary test code, commented-out debugging code, or leftover TODO comments.

**Verification command:**
```bash
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ lib/ components/
```

**Success criterion:** The grep command returns zero results. Only `console.error` calls remain in catch blocks for genuine error handling.

---

### [x] Task 5.9 — End-to-end verification of Sprint 5

**Files involved:** All files from this sprint.

**Required input:** All previous tasks completed.

**Expected output:** No new files. This is a comprehensive verification task.

**Success criterion:** ALL of the following are true:
1. The welcome message appears on page load from Discovery (purple)
2. Responses stream word by word (not all at once)
3. During the Manager routing phase, the UI shows "Sto analizzando la tua richiesta..."
4. Once the agent is determined, the phase transitions to agent indicator + streaming text
5. Auto-scroll works: user never needs to scroll down manually during a conversation
6. If the API fails, a user-friendly Italian error message appears in the chat
7. The UI is usable on mobile (iPhone 12 Pro test via DevTools)
8. No `console.log` statements remain in the code
9. A full conversation flow works with streaming: Discovery → Sales → Support → back to Sales
10. No TypeScript compilation errors (`npx tsc --noEmit` passes)
