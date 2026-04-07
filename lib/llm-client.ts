// === CHOOSE YOUR PROVIDER: uncomment ONE block ===

// --- CLAUDE (Anthropic) ---
// import { anthropic } from '@ai-sdk/anthropic';
// export const getManagerModel = () => anthropic('claude-haiku-4-5-20251001');
// export const getAgentModel = () => anthropic('claude-sonnet-4-6-20250415');

// --- GEMINI (Google) ---
import { google } from '@ai-sdk/google';
export const getManagerModel = () => google('gemini-1.5-flash');
export const getAgentModel = () => google('gemini-1.5-flash');


// --- GPT (OpenAI) ---
// import { openai } from '@ai-sdk/openai';
// export const getManagerModel = () => openai('gpt-4o-mini');
// export const getAgentModel = () => openai('gpt-4o');
