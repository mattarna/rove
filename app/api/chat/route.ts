import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getAgentModel } from '@/lib/llm-client';
import { getAgentSystemPrompt } from '@/lib/prompts';
import { truncateHistory, AGENT_COLORS } from '@/lib/agents';
import { routeMessage } from '@/lib/manager';

export async function POST(req: Request) {
  // Check for API Keys
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ 
      error: 'API Key missing. Please configure GOOGLE_GENERATIVE_AI_API_KEY in Vercel.' 
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { messages, currentAgent } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1].content;
    const historyForManager = messages.slice(0, -1);

    // Step 1 - Manager routing
    const selectedAgent = await routeMessage(latestUserMessage, currentAgent, historyForManager);

    // Step 2 - Agent generating response (streaming)
    const truncatedMessages = truncateHistory(messages, 20);
    const systemMessage = getAgentSystemPrompt(selectedAgent);

    const cleanMessages = truncatedMessages.map(({ role, content }) => ({
      role: role as 'user' | 'assistant',
      content,
    }));

    const result = streamText({
      model: getAgentModel(),
      system: systemMessage,
      messages: cleanMessages,
    });

    return result.toTextStreamResponse({
      headers: {
        'X-Agent-Name': selectedAgent,
        'X-Agent-Color': AGENT_COLORS[selectedAgent] || AGENT_COLORS.discovery,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ 
      error: error.message || "Errore sconosciuto durante la generazione." 
    }, { status: 500 });
  }
}
