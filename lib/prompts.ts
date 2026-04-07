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

  const formattingInstruction = `
[FORMATTING RULES]
- Use Markdown for bold (**text**), lists (* item), and headings.
- Use VERY FEW emojis (max 1 or 2 per message).
- Keep the tone professional but welcoming.
- Ensure the output is clean and easy to read.
`;

  return `[SYSTEM PROMPT]
${systemPromptContent}

${formattingInstruction}

[SHARED KNOWLEDGE BASE]
${sharedKbContent}

[SPECIALIST KNOWLEDGE BASE]
${verticalKbContent}`;
}
