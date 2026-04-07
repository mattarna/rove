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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Mi scuso, ho un problema tecnico. Riprova tra un momento.');
      }

      setLoadingPhase('idle');
      const agentName = (data.agent || currentAgent) as AgentName;
      setCurrentAgent(agentName);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        agent: agentName,
      };

      setMessages((prev) => [...prev, assistantMessage]);

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

