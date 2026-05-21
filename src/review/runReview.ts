import { missingKeyMessage, resolveConnection } from '../config/providerConfig';
import { streamReview } from '../llm/stream';
import { ProviderId } from '../llm/types';
import { REVIEW_SYSTEM_PROMPT, buildReviewUserPrompt } from '../prompts/reviewPrompt';
import { buildEstimatedUsage } from '../usage/estimate';
import {
  toUsageDisplayPayload,
  buildPreviewPayload,
  UsageDisplayPayload,
} from '../usage/formatPayload';
import { calculateCost, getModelId } from '../usage/pricing';
import { UsageSessionStore } from '../usage/sessionStore';
import { scanWorkspace } from '../workspace/scanWorkspace';
import { StackDetectionResult } from '../detection/types';

export interface ReviewCallbacks {
  onDetecting: () => void;
  onDetected: (stack: StackDetectionResult) => void;
  onStart: () => void;
  onChunk: (text: string) => void;
  onUsagePreview: (usage: UsageDisplayPayload['review']) => void;
  onUsageFinal: (usage: UsageDisplayPayload) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function runReview(
  provider: ProviderId,
  inlineApiKey: string | undefined,
  sessionStore: UsageSessionStore,
  callbacks: ReviewCallbacks
): Promise<void> {
  const connection = resolveConnection(provider, inlineApiKey);
  if (!connection) {
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

  const userPrompt = buildReviewUserPrompt(scan.contextText, scan.stack);
  const inputText = REVIEW_SYSTEM_PROMPT + userPrompt;
  const modelLabel =
    connection.provider === 'custom'
      ? (connection.model ?? 'custom-local')
      : getModelId(connection.provider);
  let outputText = '';

  try {
    const result = await streamReview(
      connection,
      REVIEW_SYSTEM_PROMPT,
      userPrompt,
      (text) => {
        outputText += text;
        callbacks.onChunk(text);

        const estimated = buildEstimatedUsage(inputText, outputText);
        const cost = calculateCost(modelLabel, estimated);
        callbacks.onUsagePreview(
          buildPreviewPayload(
            connection.provider,
            modelLabel,
            estimated.inputTokens,
            estimated.outputTokens,
            cost.inputUsd,
            cost.outputUsd
          ).review
        );
      }
    );

    const { report, session } = sessionStore.recordReview(connection.provider, result.usage);
    callbacks.onUsageFinal(
      toUsageDisplayPayload({ review: report, session })
    );
    callbacks.onDone();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    callbacks.onError(message);
  }
}
