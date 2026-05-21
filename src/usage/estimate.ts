import { TokenUsage, UsageSource } from './types';

/** Rough token estimate when APIs omit usage (~4 chars per token for English code) */
const CHARS_PER_TOKEN = 4;

export function estimateTokensFromText(text: string): number {
  if (!text.length) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function buildEstimatedUsage(inputText: string, outputText: string): TokenUsage {
  const inputTokens = estimateTokensFromText(inputText);
  const outputTokens = estimateTokensFromText(outputText);
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    source: 'estimated',
  };
}

export function mergeUsage(
  fromApi: Partial<TokenUsage> | null,
  inputText: string,
  outputText: string
): TokenUsage {
  const fallback = buildEstimatedUsage(inputText, outputText);

  if (!fromApi?.inputTokens && !fromApi?.outputTokens) {
    return fallback;
  }

  const inputTokens = fromApi.inputTokens ?? fallback.inputTokens;
  const outputTokens = fromApi.outputTokens ?? fallback.outputTokens;
  const hasBothFromApi =
    fromApi.inputTokens !== undefined && fromApi.outputTokens !== undefined;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    source: hasBothFromApi ? 'api' : 'estimated',
  };
}

export function emptyUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0, source: 'estimated' };
}
