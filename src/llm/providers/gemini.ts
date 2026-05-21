import { mergeUsage } from '../../usage/estimate';
import { readSseStream, parseApiError } from '../sse';
import { ChunkHandler } from '../types';
import { UsageAccumulator } from '../usageAccumulator';

export async function streamGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<UsageAccumulator> {
  const acc: UsageAccumulator = {};
  const inputText = systemPrompt + userPrompt;
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 2800 },
    }),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  let outputText = '';

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const meta = parsed.usageMetadata as Record<string, number> | undefined;
      if (meta) {
        if (meta.promptTokenCount !== undefined) acc.inputTokens = meta.promptTokenCount;
        if (meta.candidatesTokenCount !== undefined) {
          acc.outputTokens = meta.candidatesTokenCount;
        }
      }

      const parts = (
        (parsed.candidates as Array<Record<string, unknown>>)?.[0]?.content as Record<
          string,
          unknown
        >
      )?.parts as Array<Record<string, string>> | undefined;

      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part.text) {
            outputText += part.text;
            onChunk(part.text);
          }
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
