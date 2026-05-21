import * as vscode from 'vscode';
import { isProviderId, ProviderId } from '../llm/types';

const KEY_BY_PROVIDER: Record<ProviderId, string> = {
  claude: 'claudeApiKey',
  openai: 'openaiApiKey',
  gemini: 'geminiApiKey',
};

const LABEL_BY_PROVIDER: Record<ProviderId, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini (Google)',
};

export function getSelectedProvider(): ProviderId {
  const config = vscode.workspace.getConfiguration('codeReviewer');
  const raw = config.get<string>('provider', 'claude');
  return isProviderId(raw) ? raw : 'claude';
}

export function resolveApiKey(
  provider: ProviderId,
  inlineApiKey?: string
): string {
  if (inlineApiKey?.trim()) return inlineApiKey.trim();

  const config = vscode.workspace.getConfiguration('codeReviewer');
  const key = config.get<string>(KEY_BY_PROVIDER[provider], '')?.trim() ?? '';

  if (!key && provider === 'claude') {
    return config.get<string>('apiKey', '')?.trim() ?? '';
  }

  return key;
}

export function missingKeyMessage(provider: ProviderId): string {
  const settingKey = `codeReviewer.${KEY_BY_PROVIDER[provider]}`;
  return `No ${LABEL_BY_PROVIDER[provider]} API key. Enter it above or save it in Settings (${settingKey}).`;
}

export function settingsFilterForProvider(provider: ProviderId): string {
  return `codeReviewer.${KEY_BY_PROVIDER[provider]}`;
}

export async function saveSelectedProvider(provider: ProviderId): Promise<void> {
  await vscode.workspace
    .getConfiguration('codeReviewer')
    .update('provider', provider, vscode.ConfigurationTarget.Global);
}
