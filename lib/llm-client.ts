// === CHOOSE YOUR PROVIDER: uncomment ONE block ===

// --- CLAUDE (Anthropic) ---
import { anthropic } from '@ai-sdk/anthropic';
export const getManagerModel = () => anthropic('claude-3-5-haiku-latest');
export const getAgentModel = () => anthropic('claude-3-5-haiku-latest');


// --- GEMINI (Google) ---
// import { google } from '@ai-sdk/google';
// export const getManagerModel = () => google('gemini-2.0-flash');
// export const getAgentModel = () => google('gemini-2.5-pro-preview-05-06');

// --- GPT (OpenAI) ---
// import { openai } from '@ai-sdk/openai';
// export const getManagerModel = () => openai('gpt-4o-mini');
// export const getAgentModel = () => openai('gpt-4o');

