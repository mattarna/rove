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
    <div className="flex flex-col h-full bg-gray-50 md:shadow-xl md:rounded-2xl overflow-hidden md:border border-gray-200">
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onReset}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            title="Nuova conversazione"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <h1 className="font-semibold text-lg text-gray-800 tracking-tight">Benvenuto</h1>
        </div>
        <AgentIndicator agentName={currentAgent} />
      </div>

      
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {loadingPhase === 'routing' && (
          <TypingIndicator message="Rove sta pensando..." />
        )}
        {loadingPhase === 'generating' && messages[messages.length - 1]?.role !== 'assistant' && (
          <TypingIndicator agentName={currentAgent} message="L'agente sta scrivendo..." />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ChatInput onSend={onSend} isLoading={loadingPhase !== 'idle'} />
      </div>
    </div>
  );
}
