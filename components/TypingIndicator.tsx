'use client';

import { AgentName } from '@/lib/types';
import AgentIndicator from './AgentIndicator';

export default function TypingIndicator({ 
  agentName, 
  message = "Analizzando richiesta..." 
}: { 
  agentName?: AgentName, 
  message?: string 
}) {
  return (
    <div className="flex flex-col mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {agentName && (
        <div className="mb-1 ml-1 scale-90 origin-left">
          <AgentIndicator agentName={agentName} />
        </div>
      )}
      <div className="bg-white border border-gray-100 text-gray-400 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2 max-w-fit">
        <span className="text-xs font-medium italic mr-1">{message}</span>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
