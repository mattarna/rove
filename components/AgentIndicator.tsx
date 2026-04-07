import { AgentName } from '@/lib/types';
import { AGENT_COLORS, AGENT_DISPLAY_NAMES } from '@/lib/agents';

export default function AgentIndicator({ agentName }: { agentName: AgentName }) {
  const color = AGENT_COLORS[agentName] || AGENT_COLORS.discovery;
  const displayName = AGENT_DISPLAY_NAMES[agentName] || AGENT_DISPLAY_NAMES.discovery;

  return (
    <div className="flex items-center space-x-2 w-max bg-gray-50 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 shadow-sm transition-colors duration-300">
      <div 
        className="w-2.5 h-2.5 rounded-full shadow-inner transition-colors duration-300" 
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-700 transition-colors duration-300">{displayName}</span>
    </div>
  );
}
