'use client';

import { useState } from 'react';
import { ChatMessage, AgentName } from '@/lib/types';
import ChatWindow from '@/components/ChatWindow';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto. Dimmi, che tipo di esperienza stai sognando?',
  agent: 'discovery',
};

export type LoadingPhase = 'idle' | 'routing' | 'generating';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [currentAgent, setCurrentAgent] = useState<AgentName>('discovery');
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');

  const handleSend = async (messageContent: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: messageContent };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setLoadingPhase('routing');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages, currentAgent }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Il servizio è momentaneamente sovraccarico. Riprova tra qualche secondo.');
        }
        throw new Error('Mi scuso, ho un problema tecnico. Riprova tra un momento.');
      }

      setLoadingPhase('generating');

      const agentName = (response.headers.get('X-Agent-Name') || currentAgent) as AgentName;
      setCurrentAgent(agentName);

      // Create an empty assistant message entry to append chunks to
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', agent: agentName },
      ]);

      if (!response.body) throw new Error("No response body stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        
        if (chunkValue) {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: updated[lastIdx].content + chunkValue,
            };
            return updated;
          });
        }
      }

    } catch (error: any) {
      // Don't show technical js errors to the user
      const message = error.message.includes('servizio') || error.message.includes('Mi scuso')
        ? error.message
        : 'Mi scuso, ho un problema tecnico. Riprova tra un momento.';
        
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: message,
        agent: currentAgent
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoadingPhase('idle');
    }
  };

  return (
    <main className="max-w-2xl mx-auto h-screen p-0 md:p-8">
      <ChatWindow 
        messages={messages} 
        currentAgent={currentAgent} 
        loadingPhase={loadingPhase} 
        onSend={handleSend} 
      />
    </main>
  );
}
