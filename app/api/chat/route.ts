import { NextResponse } from 'next/server';
import { generateText, streamText } from 'ai';
import { getAgentModel } from '@/lib/llm-client';
import { getAgentSystemPrompt } from '@/lib/prompts';
import { truncateHistory, AGENT_COLORS } from '@/lib/agents';
import { routeMessage } from '@/lib/manager';

export async function POST(req: Request) {
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

    // Make the LLM call using streamText for the selected agent
    const result = streamText({
      model: getAgentModel(),
      system: systemMessage,
      messages: truncatedMessages,
    });

    return result.toTextStreamResponse({
      headers: {
        'X-Agent-Name': selectedAgent,
        'X-Agent-Color': AGENT_COLORS[selectedAgent] || AGENT_COLORS.discovery,
      },
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ 
      agent: "discovery", 
      message: "Mi scuso, ho un problema tecnico. Riprova tra un momento.", 
      color: "#6475FA" 
    }, { status: 500 });
  }
}

