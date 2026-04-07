// === CHOOSE YOUR PROVIDER: keep ONE active block AND set ACTIVE_LLM_PROVIDER ===
// Vercel env: ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY / OPENAI_API_KEY

import { anthropic } from '@ai-sdk/anthropic';
// import { google } from '@ai-sdk/google';
// import { openai } from '@ai-sdk/openai';

export type LlmProviderId = 'google' | 'anthropic' | 'openai';

/** Must match the active `get*Model` implementation below. */
export const ACTIVE_LLM_PROVIDER: LlmProviderId = 'anthropic';

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

// --- CLAUDE (Anthropic) — set ANTHROPIC_API_KEY (e.g. on Vercel) ---
// Haiku: fast/cheap for manager routing; Sonnet: main chat quality.
// Model IDs: https://docs.anthropic.com/en/docs/about-claude/models
export const getManagerModel = () => anthropic('claude-3-5-haiku-20241022');
export const getAgentModel = () => anthropic('claude-sonnet-4-20250514');

// --- GEMINI (Google) — set GOOGLE_GENERATIVE_AI_API_KEY ---
// export const getManagerModel = () => google('gemini-2.0-flash');
// export const getAgentModel = () => google('gemini-2.0-flash');

// --- GPT (OpenAI) — set OPENAI_API_KEY ---
// export const getManagerModel = () => openai('gpt-4o-mini');
// export const getAgentModel = () => openai('gpt-4o');
