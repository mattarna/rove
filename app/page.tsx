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

  useEffect(() => {
    sessionStorage.setItem('rove-messages', JSON.stringify(messages));
    sessionStorage.setItem('rove-agent', currentAgent);
  }, [messages, currentAgent]);

  const handleReset = () => {
    if (confirm('Sei sicuro di voler ricominciare la conversazione?')) {
      sessionStorage.clear();
      window.location.reload();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, currentAgent }),
      });

      if (!response.ok) throw new Error('Errore tecnico.');

      const agent = response.headers.get('X-Agent') as AgentName || currentAgent;
      setCurrentAgent(agent);
      setLoadingPhase('generating');

      setMessages(prev => [...prev, { role: 'assistant', content: '', agent }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = '';
      while (true) {

        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process all available lines in the buffer
        let lastNewLineIndex;
        while ((lastNewLineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lastNewLineIndex).trim();
          buffer = buffer.slice(lastNewLineIndex + 1);

          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.substring(2));
              appendChunkToLastMessage(text);
            } catch (e) {}
          } else if (line.length > 0 && !line.match(/^[0-9]:/)) {
            appendChunkToLastMessage(line + '\n');
          }
        }
      }

      // Handle any remaining content in buffer (e.g. final token without \n)
      if (buffer.trim()) {
        const line = buffer.trim();
        if (line.startsWith('0:')) {
          try { appendChunkToLastMessage(JSON.parse(line.substring(2))); } catch (e) {}
        } else if (!line.match(/^[0-9]:/)) {
          appendChunkToLastMessage(line);
        }
      }


    } catch (error: any) {
      console.error(error);
      setMessages(p => [...p, { role: 'assistant', content: 'Errore tecnico. Riprova.', agent: currentAgent }]);
    } finally {
      setLoadingPhase('idle');
    }
  };

  const appendChunkToLastMessage = (chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === 'assistant') {
        last.content += chunk;
        return [...updated];
      }
      return prev;
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
