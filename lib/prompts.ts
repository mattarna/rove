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
- Use exactly ONE language per assistant message. Never mix two languages in the same reply (no English setup + Italian question in one bubble).
- Infer language from the latest user messages (last 1–3 turns). If the user writes consistently in one language, mirror that language. If mixed, use the dominant language; if unclear, default to English.
- Example phrases and templates below (in the system prompt and KB) are often in English: translate them fully into the chosen user language. Do not copy Italian snippets when the user is writing English, and vice versa.
- Knowledge base text may be Italian or English: paraphrase facts in the user's language. Do not paste untranslated KB paragraphs into the reply.
- JSON/code blocks for UI (package, comparison): keep JSON syntax and keys valid; all user-visible string VALUES inside those blocks (names, labels, descriptions, CTA) must be in the user's language.

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
