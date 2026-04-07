import { ChatMessage } from '@/lib/types';
import AgentIndicator from './AgentIndicator';
import { AGENT_COLORS } from '@/lib/agents';
import ReactMarkdown from 'react-markdown';
import PackageCard from './PackageCard';
import ComparisonTable from './ComparisonTable';

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
        className={`max-w-[95%] px-5 py-3 rounded-2xl leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
          }`}
        style={!isUser && message.agent ? { borderLeft: `2px solid ${AGENT_COLORS[message.agent] || AGENT_COLORS.discovery}` } : undefined}
      >
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2 prose-ul:my-1 prose-pre:bg-transparent prose-pre:p-0">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match ? match[1] : '';
                const content = String(children).replace(/\n$/, '');

                if (!inline && lang === 'package') {
                  try {
                    const data = JSON.parse(content);
                    return <PackageCard pkg={data} />;
                  } catch (e) {
                    return <code className={className} {...props}>{children}</code>;
                  }
                }
                
                if (!inline && lang === 'comparison') {
                  try {
                    const data = JSON.parse(content);
                    return <ComparisonTable data={data} />;
                  } catch (e) {
                    return <code className={className} {...props}>{children}</code>;
                  }
                }

                return inline ? (
                  <code className={className} {...props}>{children}</code>
                ) : (
                  <pre className={className}>
                    <code className={className} {...props}>{children}</code>
                  </pre>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
