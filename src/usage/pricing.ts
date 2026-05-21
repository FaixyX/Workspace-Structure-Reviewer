import { ProviderId } from '../llm/types';
import { UsageCost, TokenUsage } from './types';

/** USD per 1M tokens — approximate list prices; update when providers change rates */
const MODEL_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude-sonnet-4-20250514': { inputPerM: 3, outputPerM: 15 },
  'gpt-4o-mini': { inputPerM: 0.15, outputPerM: 0.6 },
  'gemini-2.0-flash': { inputPerM: 0.1, outputPerM: 0.4 },
};

const DEFAULT_BY_PROVIDER: Record<ProviderId, { inputPerM: number; outputPerM: number }> = {
  claude: { inputPerM: 3, outputPerM: 15 },
  openai: { inputPerM: 0.15, outputPerM: 0.6 },
  gemini: { inputPerM: 0.1, outputPerM: 0.4 },
};

export function getModelId(provider: ProviderId): string {
  switch (provider) {
    case 'claude':
      return 'claude-sonnet-4-20250514';
    case 'openai':
      return 'gpt-4o-mini';
    case 'gemini':
      return 'gemini-2.0-flash';
  }
}

export function calculateCost(model: string, usage: TokenUsage): UsageCost {
  const rates = MODEL_PRICING[model] ?? DEFAULT_BY_PROVIDER.claude;
  const inputUsd = (usage.inputTokens / 1_000_000) * rates.inputPerM;
  const outputUsd = (usage.outputTokens / 1_000_000) * rates.outputPerM;
  return {
    inputUsd,
    outputUsd,
    totalUsd: inputUsd + outputUsd,
  };
}

export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.0001) return '<$0.0001';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

export function formatTokens(count: number): string {
  return count.toLocaleString('en-US');
}
