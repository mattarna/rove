import { AgentName } from '@/lib/types';
import { AGENT_COLORS, AGENT_DISPLAY_NAMES } from '@/lib/agents';

export default function AgentIndicator({ agentName }: { agentName: AgentName }) {
  const color = AGENT_COLORS[agentName] || AGENT_COLORS.discovery;
  const displayName = AGENT_DISPLAY_NAMES[agentName] || AGENT_DISPLAY_NAMES.discovery;

  return (
    <div className="flex items-center space-x-2 w-max bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-slate-100 shadow-sm transition-all duration-300">
      <div 
        className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-all duration-300 animate-pulse" 
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
      />
      <span className="text-slate-600 tracking-widest">{displayName}</span>
    </div>
  );
}
