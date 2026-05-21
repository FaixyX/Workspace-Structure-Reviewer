import { TokenUsage } from '../usage/types';

export type ProviderId = 'claude' | 'openai' | 'gemini' | 'custom';

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini (Google)' },
  { id: 'custom', label: 'Custom / Local (OpenAI-compatible)' },
];

export function isProviderId(value: string): value is ProviderId {
  return (
    value === 'claude' ||
    value === 'openai' ||
    value === 'gemini' ||
    value === 'custom'
  );
}

export interface ProviderConnection {
  provider: ProviderId;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export type ChunkHandler = (text: string) => void;

export interface StreamReviewResult {
  provider: ProviderId;
  model: string;
  usage: TokenUsage;
}
