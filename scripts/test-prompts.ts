import { getAgentSystemPrompt } from '../lib/prompts';
import { AGENT_COLORS, isValidAgent } from '../lib/agents';

console.log("=== Testing Task 4.1 ===");
const salesPrompt = getAgentSystemPrompt('sales');
console.log('Sales prompt length:', salesPrompt.length);
if (salesPrompt.includes('convert qualified prospects into confirmed bookings')) {
  console.log('Sales prompt OK');
} else {
  console.log('Sales prompt MISSING KEYWORD');
}

const supportPrompt = getAgentSystemPrompt('support');
console.log('Support prompt length:', supportPrompt.length);
if (supportPrompt.includes('resolve operational issues')) {
  console.log('Support prompt OK');
} else {
  console.log('Support prompt MISSING KEYWORD');
}

console.log("\n=== Testing Task 4.2 ===");
console.log('AGENT_COLORS.sales:', AGENT_COLORS.sales);
console.log('isValidAgent("support"):', isValidAgent("support"));

console.log("\n=== Testing Task 4.7 ===");
const discoveryPrompt = getAgentSystemPrompt('discovery');
console.log(`Discovery context: ~${Math.round(discoveryPrompt.length / 4)} tokens`);
console.log(`Sales context: ~${Math.round(salesPrompt.length / 4)} tokens`);
console.log(`Support context: ~${Math.round(supportPrompt.length / 4)} tokens`);
