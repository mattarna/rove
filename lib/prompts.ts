import { AgentName } from './types';
import { loadKnowledgeBase } from './kb';

export function getAgentSystemPrompt(agent: AgentName): string {
  let promptFile = '';
  let kbFile = '';

  switch (agent) {
    case 'discovery':
      promptFile = '04_Discovery_Prompt.md';
      kbFile = '05_Discovery_KB.md';
      break;
    case 'sales':
      promptFile = '06_Sales_Prompt.md';
      kbFile = '07_Sales_KB.md';
      break;
    case 'support':
      promptFile = '08_Support_Prompt.md';
      kbFile = '09_Support_KB.md';
      break;
  }

  const systemPromptContent = loadKnowledgeBase(promptFile);
  const sharedKbContent = loadKnowledgeBase('03_Shared_KB.md');
  const verticalKbContent = loadKnowledgeBase(kbFile);

  return `[SYSTEM PROMPT]
${systemPromptContent}

[SHARED KNOWLEDGE BASE]
${sharedKbContent}

[SPECIALIST KNOWLEDGE BASE]
${verticalKbContent}`;
}
