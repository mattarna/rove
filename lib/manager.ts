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

/** First ```json ... ``` (or ``` ... ```) block in the text, inner content trimmed; else null. */
function extractMarkdownFenceInner(text: string): string | null {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : null;
}

/** Top-level JSON `"agent"` string value; safe when `reason` contains `}` or the word "discovery". */
const MANAGER_AGENT_FIELD_RE = /"agent"\s*:\s*"([^"]+)"/;

/**
 * Safely parses the Manager Agent's raw text response into a valid AgentName.
 *
 * Fallback chain for LLM output that is not strict JSON:
 *   1. JSON.parse on trimmed text, then on a ```json``` fence inner blob if present
 *   2. Regex: first `"agent":"…"` field only (no brittle `{[^}]*}` scan)
 *   3. Final fallback — currentAgent or 'discovery'
 *
 * Avoids matching the substring "discovery" inside `reason` (e.g. "last message from discovery")
 * which previously forced the wrong agent when JSON.parse failed.
 */
export function safeParseManagerResponse(
  rawText: string,
  currentAgent: AgentName | null
): AgentName {
  const fallback: AgentName = currentAgent || 'discovery';
  const trimmed = rawText.trim();
  const fencedInner = extractMarkdownFenceInner(trimmed);
  const parseCandidates: string[] = [trimmed];
  if (fencedInner) parseCandidates.unshift(fencedInner);

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed?.agent && isValidAgent(parsed.agent)) {
        return parsed.agent as AgentName;
      }
    } catch {
      // try next candidate or regex
    }
  }

  const agentMatch = trimmed.match(MANAGER_AGENT_FIELD_RE);
  if (agentMatch?.[1] && isValidAgent(agentMatch[1])) {
    return agentMatch[1] as AgentName;
  }

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
