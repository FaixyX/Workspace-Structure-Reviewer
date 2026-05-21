import { ProviderId } from './types';

export type ChunkHandler = (text: string) => void;

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

async function streamClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<void> {
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

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed.type === 'content_block_delta' &&
        parsed.delta?.type === 'text_delta' &&
        parsed.delta.text
      ) {
        onChunk(parsed.delta.text);
      }
    } catch {
      // ignore malformed SSE
    }
  });
}

async function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<void> {
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(await parseError(response));

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw);
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) onChunk(text);
    } catch {
      // ignore malformed SSE
    }
  });
}

async function streamGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<void> {
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

  await readSseStream(response, (raw) => {
    try {
      const parsed = JSON.parse(raw);
      const parts = parsed.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return;
      for (const part of parts) {
        if (part.text) onChunk(part.text);
      }
    } catch {
      // ignore malformed SSE
    }
  });
}

export async function streamReview(
  provider: ProviderId,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<void> {
  switch (provider) {
    case 'claude':
      await streamClaude(apiKey, systemPrompt, userPrompt, onChunk);
      break;
    case 'openai':
      await streamOpenAI(apiKey, systemPrompt, userPrompt, onChunk);
      break;
    case 'gemini':
      await streamGemini(apiKey, systemPrompt, userPrompt, onChunk);
      break;
  }
}
