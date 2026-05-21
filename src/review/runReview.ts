import { missingKeyMessage, resolveApiKey } from '../config/providerConfig';
import { streamReview } from '../llm/stream';
import { ProviderId } from '../llm/types';
import { REVIEW_SYSTEM_PROMPT, buildReviewUserPrompt } from '../prompts/reviewPrompt';
import { scanWorkspace } from '../workspace/scanWorkspace';
import { StackDetectionResult } from '../detection/types';

export interface ReviewCallbacks {
  onDetecting: () => void;
  onDetected: (stack: StackDetectionResult) => void;
  onStart: () => void;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function runReview(
  provider: ProviderId,
  inlineApiKey: string | undefined,
  callbacks: ReviewCallbacks
): Promise<void> {
  const apiKey = resolveApiKey(provider, inlineApiKey);
  if (!apiKey) {
    callbacks.onError(missingKeyMessage(provider));
    return;
  }

  callbacks.onDetecting();

  let scan;
  try {
    scan = await scanWorkspace();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onError(message);
    return;
  }

  callbacks.onDetected(scan.stack);
  callbacks.onStart();

  try {
    const userPrompt = buildReviewUserPrompt(scan.contextText, scan.stack);
    await streamReview(
      provider,
      apiKey,
      REVIEW_SYSTEM_PROMPT,
      userPrompt,
      callbacks.onChunk
    );
    callbacks.onDone();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onError(message);
  }
}
