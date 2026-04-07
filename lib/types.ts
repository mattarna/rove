export type AgentName = 'discovery' | 'sales' | 'support';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentName;
}

export interface ManagerResponse {
  agent: AgentName;
  reason: string;
}

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  color: string;
  promptFile: string;
  kbFile: string;
}
