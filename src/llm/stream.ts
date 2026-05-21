import { mergeUsage } from '../usage/estimate';
import { TokenUsage } from '../usage/types';
import { getModelId } from '../usage/pricing';
import { ProviderId } from './types';

export type ChunkHandler = (text: string) => void;

export interface StreamReviewResult {
  provider: ProviderId;
  model: string;
  usage: TokenUsage;
}

async function readSseStream(
  response: Response,
  onLine: (data: string) => void
): Promise<void> {
  if (!response.body) throw new Error('No response body from API.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      onLine(raw);
    }
  }
}

async function parseError(response: Response): Promise<string> {
  let msg = `API error ${response.status}`;
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const err = body?.error as Record<string, unknown> | undefined;
    if (typeof err?.message === 'string') msg = err.message;
    else if (typeof body?.error === 'string') msg = body.error;
    else if (typeof body?.message === 'string') msg = body.message;
  } catch {
    // keep default
  }
  return msg;
}

interface UsageAccumulator {
  inputTokens?: number;
  outputTokens?: number;
}

function parseClaudeUsage(parsed: Record<string, unknown>, acc: UsageAccumulator): void {
  if (parsed.type === 'message_start') {
    const message = parsed.message as Record<string, unknown> | undefined;
    const usage = message?.usage as Record<string, number> | undefined;
    if (usage?.input_tokens !== undefined) {
      acc.inputTokens = usage.input_tokens;
    }
  }
  if (parsed.type === 'message_delta') {
    const usage = parsed.usage as Record<string, number> | undefined;
    if (usage?.output_tokens !== undefined) {
      acc.outputTokens = usage.output_tokens;
    }
  }
  if (parsed.type === 'message_stop') {
    const usage = (parsed as Record<string, unknown>).usage as Record<string, number> | undefined;
    if (usage?.input_tokens !== undefined) acc.inputTokens = usage.input_tokens;
    if (usage?.output_tokens !== undefined) acc.outputTokens = usage.output_tokens;
  }
}

async function streamClaude(
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

  if (!response.ok) throw new Error(await parseError(response));

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

async function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<UsageAccumulator> {
  const acc: UsageAccumulator = {};
  const inputText = systemPrompt + userPrompt;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 2800,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(await parseError(response));

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

async function streamGemini(
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

  if (!response.ok) throw new Error(await parseError(response));

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

export async function streamReview(
  provider: ProviderId,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<StreamReviewResult> {
  const inputText = systemPrompt + userPrompt;
  let outputText = '';
  const onChunkWithCapture: ChunkHandler = (text) => {
    outputText += text;
    onChunk(text);
  };

  let acc: UsageAccumulator;
  switch (provider) {
    case 'claude':
      acc = await streamClaude(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
    case 'openai':
      acc = await streamOpenAI(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
    case 'gemini':
      acc = await streamGemini(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
  }

  const usage = mergeUsage(
    acc.inputTokens !== undefined || acc.outputTokens !== undefined
      ? {
          inputTokens: acc.inputTokens,
          outputTokens: acc.outputTokens,
          totalTokens: (acc.inputTokens ?? 0) + (acc.outputTokens ?? 0),
          source: 'api' as const,
        }
      : null,
    inputText,
    outputText
  );

  return {
    provider,
    model: getModelId(provider),
    usage,
  };
}
