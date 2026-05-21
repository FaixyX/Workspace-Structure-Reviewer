import { ProviderId } from '../llm/types';

export type UsageSource = 'api' | 'estimated';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  source: UsageSource;
}

export interface UsageCost {
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
}

export interface ReviewUsageReport {
  provider: ProviderId;
  model: string;
  usage: TokenUsage;
  cost: UsageCost;
}

export interface SessionUsageTotals {
  reviewCount: number;
  inputTokens: number;
  outputTokens: number;
  totalUsd: number;
}

export interface UsageSummaryPayload {
  review: ReviewUsageReport;
  session: SessionUsageTotals;
}
