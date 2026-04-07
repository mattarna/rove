import type { ComponentPropsWithoutRef } from 'react';
import { ChatMessage } from '@/lib/types';
import AgentIndicator from './AgentIndicator';
import { AGENT_COLORS } from '@/lib/agents';
import ReactMarkdown from 'react-markdown';
import PackageCard from './PackageCard';
import ComparisonTable from './ComparisonTable';

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (!message.content.trim()) return null;
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
              pre({ children }) {
                return <>{children}</>;
              },
              code({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) {
                const match = /language-(\w+)/.exec(className || '');
                const lang = match?.[1] ?? '';
                const isBlock = lang.length > 0;
                const content = String(children).replace(/\n$/, '');

                if (isBlock && lang === 'package') {
                  try {
                    const data = JSON.parse(content);
                    return <PackageCard pkg={data} />;
                  } catch {
                    return (
                      <pre className="my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm border border-gray-100">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                }

                if (isBlock && lang === 'comparison') {
                  try {
                    const data = JSON.parse(content);
                    return <ComparisonTable data={data} />;
                  } catch {
                    return (
                      <pre className="my-2 p-2 bg-gray-50 rounded overflow-x-auto text-sm border border-gray-100">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  }
                }

                if (isBlock) {
                  return (
                    <pre className="my-2 p-2 bg-gray-50 rounded-lg overflow-x-auto text-sm border border-gray-100">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                }

                return (
                  <code
                    className="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 text-[0.9em] font-mono"
                    {...props}
                  >
                    {children}
                  </code>
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
