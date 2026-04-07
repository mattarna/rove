# ROVE — Fix: Streaming + Message Length

**From Matt | April 7, 2026 | Priority: High**

---

## Problem

Two UX issues are making the chatbot feel broken even when it works:

1. **No streaming.** The user sends a message, waits 5-10 seconds staring at nothing, then a wall of text appears all at once. This feels like the app is frozen. Every modern chat interface (ChatGPT, Claude, Gemini) streams text word-by-word as it generates.

2. **Messages are too long and unformatted.** Discovery is dumping 150+ words in a single block: budget context, three destination suggestions, a question, and travel style options all in one paragraph. No line breaks, no structure, no breathing room.

These are two separate fixes. Both are required.

---

## Fix 1: Implement Streaming

**What:** Instead of waiting for the full LLM response and then returning it, stream the text to the frontend token by token so the user sees words appearing in real time.

**Why this matters:** Perceived wait time drops from 5-10 seconds to under 1 second (first token appears almost immediately). The user starts reading while the rest generates.

**Where:**

### Backend: `app/api/chat/route.ts`

The file already imports `streamText` from the Vercel AI SDK but never calls it. The route currently ends at line 31 (truncated). Complete it:

```ts
// After Manager routing (line 28-29), add:

const systemPrompt = getAgentSystemPrompt(selectedAgent);
const truncatedMessages = truncateHistory(messages, 10);

const result = streamText({
  model: getAgentModel(),
  system: systemPrompt,
  messages: truncatedMessages,
});

// Return streaming response with agent metadata in headers
return new Response(result.textStream, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Agent': selectedAgent,
    'X-Agent-Color': AGENT_COLORS[selectedAgent],
  },
});
```

### Frontend: `app/page.tsx`

The `handleSend` function (truncated at line 54) needs to consume the stream. Replace the current `fetch` + `response.json()` pattern with a streaming reader:

```ts
const handleSend = async (messageContent: string) => {
  if (!messageContent.trim()) return;

  const newUserMessage: ChatMessage = { role: 'user', content: messageContent };
  setMessages(prev => [...prev, newUserMessage]);
  setLoadingPhase('routing');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, newUserMessage],
        currentAgent,
      }),
    });

    const agent = response.headers.get('X-Agent') as AgentName || currentAgent;
    setCurrentAgent(agent);
    setLoadingPhase('generating');

    // Create empty assistant message, then fill it as stream arrives
    const assistantMessage: ChatMessage = { role: 'assistant', content: '', agent };
    setMessages(prev => [...prev, assistantMessage]);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.content += chunk;
        return [...updated];
      });
    }
  } catch (error) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Mi dispiace, si è verificato un errore. Riprova tra poco.',
      agent: currentAgent,
    }]);
  } finally {
    setLoadingPhase('idle');
  }
};
```

**Effort:** 1-2 hours. The Vercel AI SDK handles all the complexity. The backend change is ~10 lines, the frontend change is ~40 lines.

---

## Fix 2: Shorter, Better Formatted Messages

**What:** Constrain all agents to respond in short, conversational messages (max 3-4 sentences), and ensure proper markdown formatting renders correctly.

**Where:**

### `lib/prompts.ts` — Complete the formatting rules

The file is truncated at line 30. Complete the `formattingInstruction` string:

```ts
const formattingInstruction = `
[FORMATTING RULES]
- Keep each response SHORT: maximum 3-4 sentences.
- You are in a CHAT, not writing an email. Be conversational and concise.
- Ask ONE question at a time. Never stack multiple questions in one message.
- Use line breaks between distinct thoughts (separate paragraphs).
- Use **bold** for destination names and key terms only.
- Use VERY FEW emojis (max 1 per message, only if natural).
- NEVER dump all information at once. Reveal progressively across multiple exchanges.
- If you need to mention multiple destinations, keep it brief: name them with one line each, then ask which interests them most.
`;
```

### All three agent prompts — Add length constraint

Add this rule to `docs/04_Discovery_Prompt.md`, `docs/06_Sales_Prompt.md`, and `docs/08_Support_Prompt.md` in the RULES section:

```
- RESPONSE LENGTH: Maximum 3-4 sentences per message. You are in a real-time
  chat, not writing an email. Ask ONE question at a time. If you have multiple
  things to say, prioritize the most important and save the rest for follow-up
  messages. The user will respond and you can continue the conversation.
```

### Example: What Discovery should look like AFTER the fix

**Before (current — wall of text):**
> Ottima domanda! Per le Maldive, le nostre esperienze esclusive partono indicativamente da circa €5.800 a persona a settimana, includendo voli e sistemazione in resort di qualità. Con un budget di circa €2.000 a persona, possiamo esplorare altre destinazioni meravigliose che offrono un ottimo equilibrio tra relax, avventura e cultura. Penso a itinerari affascinanti in **Marocco**, alle meraviglie storiche e marine dell'**Egitto**, o a esperienze dinamiche nel **Sud della Thailandia**. Ti incuriosiscono queste alternative? E, proseguendo con le nostre domande, cosa ti attrae di più in un viaggio: rilassarti su una spiaggia incontaminata, esplorare la natura in safari, immergerti nella cultura locale, o un mix?

**After (target):**
> Con €2.000 a persona possiamo creare esperienze incredibili in **Marocco**, **Egitto** o **Sud della Thailandia**.
>
> Quale ti incuriosisce di più?

The second version says the same thing in 80% fewer words and is actually more effective because it invites the user to engage rather than overwhelming them.

**Effort:** 30 minutes. Prompt text changes only, no code.

---

## Summary

| Fix | What | Effort | Impact |
|-----|------|--------|--------|
| Streaming | Complete `route.ts` + update `page.tsx` to consume stream | 1-2 hours | Eliminates perceived wait time |
| Message length | Update prompts + complete `prompts.ts` formatting rules | 30 min | Messages go from 150 words to 30 words |

**Do streaming first.** It solves the wait time immediately. Then tighten the prompts, which is a text-only change you can iterate on without redeploying code.
