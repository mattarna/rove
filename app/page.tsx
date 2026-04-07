'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { ChatMessage, AgentName } from '@/lib/types';
import ChatWindow from '@/components/ChatWindow';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Ciao! Sono entusiasta di aiutarti a trovare il viaggio perfetto. Dimmi, che tipo di esperienza stai sognando?',
  agent: 'discovery',
};

export type LoadingPhase = 'idle' | 'routing' | 'generating';

/** Client-side cap for hung connections (manager + full stream). */
const CHAT_FETCH_TIMEOUT_MS = 90_000;

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

    let agentForReply: AgentName = currentAgent;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), CHAT_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, currentAgent }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Errore tecnico.');

      agentForReply = (response.headers.get('X-Agent') as AgentName) || currentAgent;
      setCurrentAgent(agentForReply);
      setLoadingPhase('generating');

      // Commit the empty assistant row before any stream chunks arrive; otherwise
      // batched updates can leave "last message = user" and all deltas are dropped.
      flushSync(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', agent: agentForReply },
        ]);
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      // Aggregate in a local string so each setState always applies the full text so far
      // (avoids race with React batching / stale closures on chunked updates).
      let aggregated = '';
      const patchLastAssistant = (text: string) => {
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          const last = next[i];
          if (!last || last.role !== 'assistant') return prev;
          next[i] = { ...last, content: text };
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        if (piece) {
          aggregated += piece;
          patchLastAssistant(aggregated);
        }
      }
      const tail = decoder.decode();
      if (tail) {
        aggregated += tail;
        patchLastAssistant(aggregated);
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content.trim()) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: 'Non ho ricevuto una risposta. Riprova.' },
          ];
        }
        return prev;
      });
    } catch (error: unknown) {
      console.error(error);
      setMessages((p) => {
        const last = p[p.length - 1];
        const emptyAssistant =
          last?.role === 'assistant' && !last.content?.trim();
        const errText =
          error instanceof Error && error.name === 'AbortError'
            ? 'La richiesta ha impiegato troppo tempo. Riprova.'
            : 'Errore tecnico. Riprova.';
        if (emptyAssistant) {
          return [
            ...p.slice(0, -1),
            { role: 'assistant', content: errText, agent: agentForReply },
          ];
        }
        return [...p, { role: 'assistant', content: errText, agent: agentForReply }];
      });
    } finally {
      clearTimeout(timeoutId);
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
        onReset={handleReset}
      />
    </main>
  );
}
