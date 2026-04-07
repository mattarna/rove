import { ChatMessage } from '@/lib/types';
import AgentIndicator from './AgentIndicator';
import { AGENT_COLORS } from '@/lib/agents';
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && message.agent && (
        <div className="mb-1 ml-1 scale-90 origin-left">
          <AgentIndicator agentName={message.agent} />
        </div>
      )}
      <div
        className={`max-w-[85%] px-5 py-3 rounded-2xl leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
          }`}
        style={!isUser && message.agent ? { borderLeft: `2px solid ${AGENT_COLORS[message.agent] || AGENT_COLORS.discovery}` } : undefined}
      >
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2 prose-ul:my-1">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

