'use client';

import { useState, useEffect } from 'react';
import { ChatMessage, AgentName } from '@/lib/types';
import ChatWindow from '@/components/ChatWindow';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto. Dimmi, che tipo di esperienza stai sognando?',
  agent: 'discovery',
};

export type LoadingPhase = 'idle' | 'routing' | 'generating';

export default function Home() {
  // Initialize state from sessionStorage if available
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('rove-messages');
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    }
    return [WELCOME_MESSAGE];
  });

  const [currentAgent, setCurrentAgent] = useState<AgentName>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('rove-agent');
      return (saved as AgentName) || 'discovery';
    }
    return 'discovery';
  });

  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');

  // Persist to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem('rove-messages', JSON.stringify(messages));
    sessionStorage.setItem('rove-agent', currentAgent);
  }, [messages, currentAgent]);

  const handleReset = () => {
    if (confirm('Sei sicuro di voler ricominciare la conversazione?')) {
      sessionStorage.removeItem('rove-messages');
      sessionStorage.removeItem('rove-agent');
      setMessages([WELCOME_MESSAGE]);
      setCurrentAgent('discovery');
      setLoadingPhase('idle');
    }
  };

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
        throw new Error(errorData.error || 'Errore tecnico durante la chiamata.');
      }

      setLoadingPhase('generating');

      const agentNameFromHeader = response.headers.get('X-Agent-Name') as AgentName;
      const agentName = agentNameFromHeader || currentAgent;
      setCurrentAgent(agentName);

      // Create an empty assistant message entry to stream into
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
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          // AI SDK protocol parsing (0:"...") or raw text (fallback)
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.substring(2));
              appendChunkToLastMessage(text);
            } catch { /* ignore bad json in protocol */ }
          } else if (!line.match(/^[0-9]:/)) {
            appendChunkToLastMessage(line);
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

  const appendChunkToLastMessage = (chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      updated[lastIdx] = {
        ...updated[lastIdx],
        content: updated[lastIdx].content + chunk,
      };
      return updated;
    });
  };

  return (
    <main className="max-w-2xl mx-auto h-screen p-0 md:p-8">
      <ChatWindow 
        messages={messages} 
        currentAgent={currentAgent} 
        loadingPhase={loadingPhase} 
        onSend={handleSend}
        onReset={handleReset}
      />
    </main>

  );
}
