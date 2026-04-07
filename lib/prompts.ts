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
[LANGUAGE RULES]
- Match the user's language in every reply (Italian, English, etc.).
- If the user's language is unclear, default to English.
- The knowledge base may be in English; still answer in the user's language.

[FORMATTING RULES]
- Keep each response SHORT: maximum 3-4 sentences.
- You are in a CHAT, not writing an email. Be conversational and concise.
- Ask ONE question at a time. Never stack multiple questions in one message.
- Use line breaks between distinct thoughts (separate paragraphs).
- Use **bold** for destination names and key terms only.
- Use VERY FEW emojis (max 1 per message, only if natural).
- NEVER dump all information at once. Reveal progressively across multiple exchanges.
- If you need to mention multiple destinations, keep it brief: name them with one line each, then ask which interests them most.
`;


  return `[SYSTEM PROMPT]
${systemPromptContent}

${formattingInstruction}

[SHARED KNOWLEDGE BASE]
${sharedKbContent}

[SPECIALIST KNOWLEDGE BASE]
${verticalKbContent}`;
}
