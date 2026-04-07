import { NextResponse } from 'next/server';
import { generateText, streamText } from 'ai';
import { getAgentModel } from '@/lib/llm-client';
import { getAgentSystemPrompt } from '@/lib/prompts';
import { truncateHistory, AGENT_COLORS } from '@/lib/agents';
import { routeMessage } from '@/lib/manager';

export async function POST(req: Request) {
  // Check for Anthropic key presence to prevent silent failures
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ 
      error: 'API Key missing. Please configure ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in Vercel.' 
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

    // Clean messages to strict role/content format
    const cleanMessages = truncatedMessages.map(({ role, content }) => ({
      role: role as 'user' | 'assistant',
      content,
    }));

    // Step 2 - Agent generating response (NON-STREAMING for debug)
    const result = await generateText({
      model: getAgentModel(),
      system: systemMessage,
      messages: cleanMessages,
    });

    return NextResponse.json({
      agent: selectedAgent,
      message: result.text,
      color: AGENT_COLORS[selectedAgent] || AGENT_COLORS.discovery
    }, {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    
    // Proviamo a estrarre più dettagli dall'errore di Anthropic
    let detailedError = "Errore sconosciuto";
    if (error && typeof error === 'object') {
       detailedError = error.message || JSON.stringify(error);
    }

    return NextResponse.json({ 
      agent: "discovery", 
      message: "Dettagli Errore: " + detailedError, 
      color: "#6475FA" 
    }, { status: 500 });
  }
}



