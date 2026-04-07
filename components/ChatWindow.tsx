'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage, AgentName } from '@/lib/types';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import AgentIndicator from './AgentIndicator';
import { LoadingPhase } from '@/app/page';

export default function ChatWindow({
  messages,
  currentAgent,
  loadingPhase,
  onSend,
}: {
  messages: ChatMessage[];
  currentAgent: AgentName;
  loadingPhase: LoadingPhase;
  onSend: (message: string) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingPhase]);

  return (
    <div className="flex flex-col h-full bg-gray-50 md:shadow-xl md:rounded-2xl overflow-hidden md:border border-gray-200">
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <h1 className="font-semibold text-lg text-gray-800 tracking-tight">Benvenuto</h1>
        <AgentIndicator agentName={currentAgent} />
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-2">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {loadingPhase === 'routing' && (
          <div className="flex mb-6 text-sm text-gray-400 italic">
            Sto analizzando la tua richiesta...
          </div>
        )}
        {loadingPhase === 'generating' && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex mb-6 text-sm text-gray-400 italic">
            <AgentIndicator agentName={currentAgent} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <ChatInput onSend={onSend} isLoading={loadingPhase !== 'idle'} />
      </div>
    </div>
  );
}
