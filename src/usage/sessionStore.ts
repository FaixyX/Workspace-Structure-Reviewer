import * as vscode from 'vscode';
import { ProviderId } from '../llm/types';
import { calculateCost, getModelId } from './pricing';
import { ReviewUsageReport, SessionUsageTotals, TokenUsage } from './types';

const STORAGE_KEY = 'codeReviewer.sessionUsage';

interface StoredSession {
  reviewCount: number;
  inputTokens: number;
  outputTokens: number;
  totalUsd: number;
}

export class UsageSessionStore {
  constructor(private readonly globalState: vscode.Memento) {}

  getTotals(): SessionUsageTotals {
    const stored = this.globalState.get<StoredSession>(STORAGE_KEY);
    if (!stored) {
      return { reviewCount: 0, inputTokens: 0, outputTokens: 0, totalUsd: 0 };
    }
    return {
      reviewCount: stored.reviewCount,
      inputTokens: stored.inputTokens,
      outputTokens: stored.outputTokens,
      totalUsd: stored.totalUsd,
    };
  }

  recordReview(
    provider: ProviderId,
    usage: TokenUsage
  ): { report: ReviewUsageReport; session: SessionUsageTotals } {
    const model = getModelId(provider);
    const cost = calculateCost(model, usage);
    const report: ReviewUsageReport = { provider, model, usage, cost };

    const prev = this.globalState.get<StoredSession>(STORAGE_KEY) ?? {
      reviewCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalUsd: 0,
    };

    const next: StoredSession = {
      reviewCount: prev.reviewCount + 1,
      inputTokens: prev.inputTokens + usage.inputTokens,
      outputTokens: prev.outputTokens + usage.outputTokens,
      totalUsd: prev.totalUsd + cost.totalUsd,
    };

    void this.globalState.update(STORAGE_KEY, next);

    return {
      report,
      session: {
        reviewCount: next.reviewCount,
        inputTokens: next.inputTokens,
        outputTokens: next.outputTokens,
        totalUsd: next.totalUsd,
      },
    };
  }

  async clearSession(): Promise<SessionUsageTotals> {
    await this.globalState.update(STORAGE_KEY, undefined);
    return { reviewCount: 0, inputTokens: 0, outputTokens: 0, totalUsd: 0 };
  }
}
