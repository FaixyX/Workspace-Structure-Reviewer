import { formatTokens, formatUsd } from './pricing';
import { ReviewUsageReport, SessionUsageTotals, UsageSummaryPayload } from './types';

export interface UsageDisplayPayload {
  review: {
    provider: string;
    model: string;
    inputTokens: string;
    outputTokens: string;
    totalTokens: string;
    inputCost: string;
    outputCost: string;
    totalCost: string;
    sourceLabel: string;
  };
  session: {
    reviewCount: number;
    inputTokens: string;
    outputTokens: string;
    totalCost: string;
  };
}

export function toUsageDisplayPayload(
  summary: UsageSummaryPayload
): UsageDisplayPayload {
  const { review, session } = summary;
  const sourceLabel =
    review.usage.source === 'api' ? 'from provider API' : 'estimated (~4 chars/token)';

  return {
    review: {
      provider: review.provider,
      model: review.model,
      inputTokens: formatTokens(review.usage.inputTokens),
      outputTokens: formatTokens(review.usage.outputTokens),
      totalTokens: formatTokens(review.usage.totalTokens),
      inputCost: formatUsd(review.cost.inputUsd),
      outputCost: formatUsd(review.cost.outputUsd),
      totalCost: formatUsd(review.cost.totalUsd),
      sourceLabel,
    },
    session: {
      reviewCount: session.reviewCount,
      inputTokens: formatTokens(session.inputTokens),
      outputTokens: formatTokens(session.outputTokens),
      totalCost: formatUsd(session.totalUsd),
    },
  };
}

export function buildPreviewPayload(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  inputUsd: number,
  outputUsd: number
): Pick<UsageDisplayPayload, 'review'> {
  return {
    review: {
      provider,
      model,
      inputTokens: formatTokens(inputTokens),
      outputTokens: formatTokens(outputTokens),
      totalTokens: formatTokens(inputTokens + outputTokens),
      inputCost: formatUsd(inputUsd),
      outputCost: formatUsd(outputUsd),
      totalCost: formatUsd(inputUsd + outputUsd),
      sourceLabel: 'live estimate while streaming',
    },
  };
}
