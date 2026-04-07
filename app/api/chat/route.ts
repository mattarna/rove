import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getAgentModel } from '@/lib/llm-client';
import { getAgentSystemPrompt } from '@/lib/prompts';
import { truncateHistory, AGENT_COLORS } from '@/lib/agents';
import { routeMessage } from '@/lib/manager';

// Use standard Node.js runtime to allow 'fs' access for knowledge base files
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'API Key missing.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { messages, currentAgent } = body;

    const latestUserMessage = messages[messages.length - 1].content;
    const historyForManager = messages.slice(0, -1);

    // Step 1 - Manager routing
    const selectedAgent = await routeMessage(latestUserMessage, currentAgent, historyForManager);

    // Step 2 - Agent generating response (streaming)
    const systemPrompt = getAgentSystemPrompt(selectedAgent);
    const truncatedMessages = truncateHistory(messages, 10);

    const cleanMessages = truncatedMessages.map(({ role, content }) => ({
      role: role as 'user' | 'assistant',
      content,
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
