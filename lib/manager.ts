import { generateText } from 'ai';
import { AgentName, ChatMessage } from './types';
import { getManagerModel } from './llm-client';
import { loadKnowledgeBase } from './kb';
import { isValidAgent } from './agents';

/** When these match, intent likely needs full manager routing (handoff). IT + EN. */
const SUPPORT_HINTS =
  /rimborso|reclamo|problema|non\s+funziona|volo\s+cancell|cancellat|assistenza|post[\s-]?vendita|ho\s+gi[aà]\s+(comprat|acquist|prenot)|prenotazione\s+confermata|bagaglio\s+perso|check-?in|refund|complaint|problem|after[\s-]?sales|already\s+(bought|booked)|lost\s+luggage|confirmed\s+booking/i;
const SALES_HINTS =
  /prezz|costo|€|\beuro\b|prenot|compr|pacchett|offerta|sconto|pagament|quotaz|acconto|price|cost|\$|\busd\b|\beur\b|book|buy|package|offer|discount|payment|deposit|quot(e|ation)/i;

/**
 * Skip the manager LLM when the active agent is likely correct and the user
 * did not introduce obvious handoff signals. Returns null to run full routing.
 *
 * Discovery never fast-routes: handoff to Sales/Support depends on full history
 * (e.g. user says "thanks" after qualification). Keyword checks on the latest
 * message alone would keep routing stuck on discovery.
 */
export function tryFastRoute(
  userMessage: string,
  currentAgent: AgentName | null
): AgentName | null {
  const active: AgentName = currentAgent || 'discovery';

  if (active === 'discovery') {
    return null;
  }

  if (active === 'sales') {
    if (SUPPORT_HINTS.test(userMessage)) {
      return null;
    }
    return 'sales';
  }

  if (active === 'support') {
    if (
      /nuovo\s+viaggio|altro\s+viaggio|da\s+capo|ripartire|ricominciare|new\s+trip|start\s+over|another\s+trip|from\s+scratch/i.test(
        userMessage
      )
    ) {
      return null;
    }
    return 'support';
  }

  return null;
}

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

  const fast = tryFastRoute(userMessage, currentAgent);
  if (fast !== null) {
    return fast;
  }

  try {
    // Use only the last 10 messages for the Manager — lightweight routing call
    const recentHistory = history.slice(-10).map((m) => {
      const entry: { role: string; content: string; agent?: AgentName } = {
        role: m.role,
        content: m.content,
      };
      if (m.role === 'assistant' && m.agent) {
        entry.agent = m.agent;
      }
      return entry;
    });

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
