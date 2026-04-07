import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getAgentModel, hasApiKey } from '@/lib/llm-client';
import { getAgentSystemPrompt } from '@/lib/prompts';
import { truncateHistory, AGENT_COLORS } from '@/lib/agents';
import { routeMessage } from '@/lib/manager';
import type { AgentName, ChatMessage } from '@/lib/types';

// Use standard Node.js runtime to allow 'fs' access for knowledge base files
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return NextResponse.json({ error: 'API Key missing.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Expected JSON object.' }, { status: 400 });
  }

  const { messages, currentAgent } = body as {
    messages?: unknown;
    currentAgent?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: '`messages` must be a non-empty array.' },
      { status: 400 }
    );
  }

  const lastMsg = messages[messages.length - 1] as { role?: unknown; content?: unknown };
  if (
    !lastMsg ||
    lastMsg.role !== 'user' ||
    typeof lastMsg.content !== 'string' ||
    !lastMsg.content.trim()
  ) {
    return NextResponse.json(
      { error: 'Last message must be a non-empty user message with string content.' },
      { status: 400 }
    );
  }

  try {
    const typedMessages = messages as ChatMessage[];
    const latestUserMessage = lastMsg.content;
    const historyForManager = typedMessages.slice(0, -1);
    const agentCtx =
      typeof currentAgent === 'string' ? (currentAgent as AgentName) : null;

    // Step 1 - Manager routing
    const selectedAgent = await routeMessage(latestUserMessage, agentCtx, historyForManager);

    // Step 2 - Agent generating response (streaming)
    const systemPrompt = getAgentSystemPrompt(selectedAgent);
    const truncatedMessages = truncateHistory(typedMessages);

    const cleanMessages = truncatedMessages.map(({ role, content }) => ({
      role: role as 'user' | 'assistant',
      content: typeof content === 'string' ? content : String(content ?? ''),
    }));

    const result = streamText({
      model: getAgentModel(),
      system: systemPrompt,
      messages: cleanMessages,
    });

    return result.toTextStreamResponse({
      headers: {
        'X-Agent': selectedAgent,
        'X-Agent-Color': AGENT_COLORS[selectedAgent],
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
