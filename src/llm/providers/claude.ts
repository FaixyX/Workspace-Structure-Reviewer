import { mergeUsage } from '../../usage/estimate';
import { readSseStream, parseApiError } from '../sse';
import { ChunkHandler } from '../types';
import { UsageAccumulator } from '../usageAccumulator';

function parseClaudeUsage(parsed: Record<string, unknown>, acc: UsageAccumulator): void {
  if (parsed.type === 'message_start') {
    const message = parsed.message as Record<string, unknown> | undefined;
    const usage = message?.usage as Record<string, number> | undefined;
    if (usage?.input_tokens !== undefined) acc.inputTokens = usage.input_tokens;
  }
  if (parsed.type === 'message_delta') {
    const usage = parsed.usage as Record<string, number> | undefined;
    if (usage?.output_tokens !== undefined) acc.outputTokens = usage.output_tokens;
  }
  if (parsed.type === 'message_stop') {
    const usage = parsed.usage as Record<string, number> | undefined;
    if (usage?.input_tokens !== undefined) acc.inputTokens = usage.input_tokens;
    if (usage?.output_tokens !== undefined) acc.outputTokens = usage.output_tokens;
  }
}

export async function streamClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<UsageAccumulator> {
  const acc: UsageAccumulator = {};
  const inputText = systemPrompt + userPrompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2800,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  let outputText = '';

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      parseClaudeUsage(parsed, acc);

      if (
        parsed.type === 'content_block_delta' &&
        (parsed.delta as Record<string, unknown>)?.type === 'text_delta'
      ) {
        const text = (parsed.delta as Record<string, string>).text;
        if (text) {
          outputText += text;
          onChunk(text);
        }
      }
    } catch {
      // ignore malformed SSE
    }
  });

  if (acc.inputTokens === undefined) {
    acc.inputTokens = mergeUsage(null, inputText, '').inputTokens;
  }
  if (acc.outputTokens === undefined) {
    acc.outputTokens = mergeUsage(null, '', outputText).outputTokens;
  }

  return acc;
}
