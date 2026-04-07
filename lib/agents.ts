import { AgentName, ChatMessage } from './types';

export const AGENT_COLORS: Record<AgentName, string> = {
  discovery: '#6475FA',
  sales: '#E8650A',
  support: '#22C55E',
};

export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  discovery: 'ROVE Discovery',
  sales: 'ROVE Sales',
  support: 'ROVE Support',
};

export const VALID_AGENTS = ['discovery', 'sales', 'support'] as const;

export function isValidAgent(agent: string): agent is AgentName {
  return VALID_AGENTS.includes(agent as AgentName);
}

export function truncateHistory(messages: ChatMessage[], maxLength: number = 20): ChatMessage[] {
  if (messages.length <= maxLength) {
    return messages;
  }
  
  // Stretch goal: context-aware truncation. Protect the first user message 
  // to retain core user preferences, and take the remaining from the end.
  const firstMessage = messages[0];
  const lastMessages = messages.slice(-(maxLength - 1));
  
  return [firstMessage, ...lastMessages];
}
