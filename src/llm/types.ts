export type ProviderId = 'claude' | 'openai' | 'gemini';

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini (Google)' },
];

export function isProviderId(value: string): value is ProviderId {
  return value === 'claude' || value === 'openai' || value === 'gemini';
}
