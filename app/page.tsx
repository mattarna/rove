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
    if (!messageContent.trim()) return;

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Mi scuso, ho un problema tecnico. Riprova tra un momento.');
      }

      setLoadingPhase('generating');

      const agentName = (response.headers.get('X-Agent-Name') || currentAgent) as AgentName;
      setCurrentAgent(agentName);

      // Create an empty assistant message entry
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', agent: agentName },
      ]);

      if (!response.body) throw new Error("No response body stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // The Vercel AI SDK protocol sends data as: 0:"message content here"
        // We need to parse these chunks or simply strip the protocol prefix if present
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          // If the line starts with 0: (text chunk in Vercel protocol)
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.substring(2));
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + text,
                };
                return updated;
              });
            } catch {
              // Fallback if JSON parse fails
              continue;
            }
          } 
          // If it's a raw text chunk (no protocol)
          else if (!line.match(/^[0-9]:/)) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + line,
              };
              return updated;
            });
          }
        }
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error.message || 'Mi scuso, ho un problema tecnico. Riprova tra un momento.',
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

