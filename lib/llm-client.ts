// === CHOOSE YOUR PROVIDER: uncomment ONE block AND set ACTIVE_LLM_PROVIDER ===

import { google } from '@ai-sdk/google';
// import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';

export type LlmProviderId = 'google' | 'anthropic' | 'openai';

/** Must match the uncommented provider block below (so API route env checks stay correct). */
export const ACTIVE_LLM_PROVIDER: LlmProviderId = 'google';

export function hasApiKey(): boolean {
  switch (ACTIVE_LLM_PROVIDER) {
    case 'google':
      return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY);
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY);
    default:
      return false;
  }
}

// --- CLAUDE (Anthropic) ---
// export const getManagerModel = () => anthropic('claude-haiku-4-5-20251001');
// export const getAgentModel = () => anthropic('claude-sonnet-4-6-20250415');

// --- GEMINI (Google) ---
export const getManagerModel = () => google('gemini-2.0-flash');
export const getAgentModel = () => google('gemini-2.0-flash');

// --- GPT (OpenAI) ---
// export const getManagerModel = () => openai('gpt-4o-mini');
// export const getAgentModel = () => openai('gpt-4o');
