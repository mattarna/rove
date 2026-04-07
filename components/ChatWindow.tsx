'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage, AgentName } from '@/lib/types';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import AgentIndicator from './AgentIndicator';
import TypingIndicator from './TypingIndicator';
import { LoadingPhase } from '@/app/page';

export default function ChatWindow({
  messages,
  currentAgent,
  loadingPhase,
  onSend,
  onReset,
}: {
  messages: ChatMessage[];
  currentAgent: AgentName;
  loadingPhase: LoadingPhase;
  onSend: (message: string) => void;
  onReset?: () => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingPhase]);

  return (
    <div className="flex flex-col h-full glass md:shadow-2xl md:rounded-3xl overflow-hidden border border-white/20 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onReset}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
            title="Nuova conversazione"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight leading-none">ROVE</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">L'Astrolabio AI Assistant</p>
          </div>
        </div>
        <AgentIndicator agentName={currentAgent} />
      </div>

      
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <MessageBubble message={msg} />
          </div>
        ))}
        {loadingPhase === 'routing' && (
          <div className="animate-pulse">
            <TypingIndicator message="ROVE sta analizzando la tua richiesta..." />
          </div>
        )}
        {(loadingPhase === 'generating' || (messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content)) && (
          <TypingIndicator agentName={currentAgent} message="L'agente sta scrivendo..." />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 md:p-6 bg-white/50 backdrop-blur-sm border-t border-slate-100">
        <ChatInput onSend={onSend} isLoading={loadingPhase !== 'idle'} />
      </div>
    </div>
  );
}
