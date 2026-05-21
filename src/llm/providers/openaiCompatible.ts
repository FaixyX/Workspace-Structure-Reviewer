import { mergeUsage } from '../../usage/estimate';
import { readSseStream, parseApiError } from '../sse';
import { ChunkHandler } from '../types';
import { UsageAccumulator } from '../usageAccumulator';

export function normalizeOpenAiBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length);
  }
  return url;
}

export async function streamOpenAICompatible(
  endpoint: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<UsageAccumulator> {
  const acc: UsageAccumulator = {};
  const inputText = systemPrompt + userPrompt;
  const url = `${normalizeOpenAiBaseUrl(endpoint)}/chat/completions`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 2800,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  let outputText = '';

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const usage = parsed.usage as Record<string, number> | undefined;
      if (usage) {
        if (usage.prompt_tokens !== undefined) acc.inputTokens = usage.prompt_tokens;
        if (usage.completion_tokens !== undefined) acc.outputTokens = usage.completion_tokens;
      }

      const text = (parsed.choices as Array<Record<string, unknown>>)?.[0]
        ?.delta as Record<string, string> | undefined;
      if (text?.content) {
        outputText += text.content;
        onChunk(text.content);
      }
    } catch {
      // ignore malformed SSE
    }
  });

  if (acc.outputTokens === undefined) {
    acc.outputTokens = mergeUsage(null, '', outputText).outputTokens;
  }
  if (acc.inputTokens === undefined) {
    acc.inputTokens = mergeUsage(null, inputText, '').inputTokens;
  }

  return acc;
}
