import { generateText } from 'ai';
import { AgentName, ChatMessage } from './types';
import { getManagerModel } from './llm-client';
import { loadKnowledgeBase } from './kb';
import { isValidAgent } from './agents';

/**
 * Returns the Manager Agent system prompt from docs/10_Manager_Prompt.md.
 */
export function getManagerSystemPrompt(): string {
  return loadKnowledgeBase('10_Manager_Prompt.md');
}

/**
 * Safely parses the Manager Agent's raw text response into a valid AgentName.
 *
 * Handles 3 levels of fallback to account for LLM "chatty" behaviour:
 *   1. Direct JSON.parse — ideal case
 *   2. Regex extraction — handles preamble text or markdown fences around JSON
 *   3. String search — handles plain-text agent name in the response
 *   4. Final fallback — returns currentAgent or 'discovery'
 */
export function safeParseManagerResponse(
  rawText: string,
  currentAgent: AgentName | null
): AgentName {
  const fallback: AgentName = currentAgent || 'discovery';

  // Attempt 1: Direct JSON parse (ideal case)
  try {
    const parsed = JSON.parse(rawText);
    if (parsed?.agent && isValidAgent(parsed.agent)) {
      return parsed.agent as AgentName;
    }
  } catch {
    // Not valid JSON — continue to next attempt
  }

  // Attempt 2: Regex extraction — find {"agent":"..."} even inside surrounding text
  // Handles cases like: ```json\n{"agent":"sales",...}\n``` or "Here is the routing: {...}"
  const jsonMatch = rawText.match(/\{[^}]*"agent"\s*:\s*"([^"]+)"[^}]*\}/);
  if (jsonMatch?.[1] && isValidAgent(jsonMatch[1])) {
    return jsonMatch[1] as AgentName;
  }

  // Attempt 3: Simple string search — handles plain-text like "The agent is discovery"
  const agentNames: AgentName[] = ['discovery', 'sales', 'support'];
  for (const agent of agentNames) {
    if (rawText.toLowerCase().includes(agent)) {
      return agent;
    }
  }

  // Final fallback: return current agent to maintain stability
  return fallback;
}

/**
 * Calls the Manager Agent LLM to classify the user's intent and determine
 * which specialist agent should handle the next message.
 *
 * Uses the fastest available model (Gemini Flash / Claude Haiku / GPT-4o-mini)
 * with temperature 0 for deterministic, JSON-structured output.
 *
 * On any error (API failure, parsing failure, timeout), returns the current
 * agent as fallback to maintain conversation continuity.
 */
export async function routeMessage(
  userMessage: string,
  currentAgent: AgentName | null,
  history: ChatMessage[]
): Promise<AgentName> {
  const fallback: AgentName = currentAgent || 'discovery';

  try {
    // Use only the last 10 messages for the Manager — lightweight routing call
    const recentHistory = history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Format input as JSON string per the Manager prompt's expected input format
    const managerInput = JSON.stringify({
      message: userMessage,
      current_agent: currentAgent ?? null,
      history: recentHistory,
    });

    const result = await generateText({
      model: getManagerModel(),
      system: getManagerSystemPrompt(),
      prompt: managerInput,
      temperature: 0,
      maxOutputTokens: 150,
    });

    return safeParseManagerResponse(result.text, currentAgent);
  } catch (error) {
    console.error('[Manager] Routing call failed — using fallback agent:', error);
    return fallback;
  }
}
