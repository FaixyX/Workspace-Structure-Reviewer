export async function readSseStream(
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

export async function parseApiError(response: Response): Promise<string> {
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
