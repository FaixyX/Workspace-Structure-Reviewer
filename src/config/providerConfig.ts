import * as vscode from 'vscode';
import { ProviderConnection, ProviderId, isProviderId } from '../llm/types';

const KEY_BY_PROVIDER: Record<ProviderId, string> = {
  claude: 'claudeApiKey',
  openai: 'openaiApiKey',
  gemini: 'geminiApiKey',
  custom: 'customApiKey',
};

const LABEL_BY_PROVIDER: Record<ProviderId, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini (Google)',
  custom: 'Custom / Local',
};

export interface ProviderPanelState {
  provider: ProviderId;
  hasSavedKey: boolean;
  keyHint: string;
  customBaseUrl: string;
  customModel: string;
}

export function getSelectedProvider(): ProviderId {
  const config = vscode.workspace.getConfiguration('codeReviewer');
  const raw = config.get<string>('provider', 'claude');
  return isProviderId(raw) ? raw : 'claude';
}

function getUnifiedApiKey(): string {
  return vscode.workspace.getConfiguration('codeReviewer').get<string>('apiKey', '')?.trim() ?? '';
}

function getProviderSpecificKey(provider: ProviderId): string {
  const config = vscode.workspace.getConfiguration('codeReviewer');
  return config.get<string>(KEY_BY_PROVIDER[provider], '')?.trim() ?? '';
}

/** Saved key for a provider (per-provider setting, then unified apiKey). */
export function getSavedApiKeyForProvider(provider: ProviderId): string {
  const specific = getProviderSpecificKey(provider);
  if (specific) return specific;
  return getUnifiedApiKey();
}

export function resolveApiKey(provider: ProviderId, inlineApiKey?: string): string {
  if (inlineApiKey?.trim()) return inlineApiKey.trim();
  return getSavedApiKeyForProvider(provider);
}

export function getCustomBaseUrl(): string {
  const raw =
    vscode.workspace.getConfiguration('codeReviewer').get<string>('customBaseUrl', '')?.trim() ??
    '';
  return raw || 'http://localhost:11434/v1';
}

export function getCustomModel(): string {
  return vscode.workspace.getConfiguration('codeReviewer').get<string>('customModel', '')?.trim() ?? '';
}

export function resolveConnection(
  provider: ProviderId,
  inlineApiKey?: string,
  overrides?: { customBaseUrl?: string; customModel?: string }
): ProviderConnection | null {
  const apiKey = resolveApiKey(provider, inlineApiKey);

  if (provider === 'custom') {
    const baseUrl = overrides?.customBaseUrl?.trim() || getCustomBaseUrl();
    const model = overrides?.customModel?.trim() || getCustomModel();
    if (!baseUrl) return null;
    if (!model) return null;
    return { provider, apiKey, baseUrl, model };
  }

  if (!apiKey) return null;
  return { provider, apiKey };
}

export function missingKeyMessage(provider: ProviderId): string {
  if (provider === 'custom') {
    const parts: string[] = [];
    if (!getCustomBaseUrl()) parts.push('codeReviewer.customBaseUrl');
    if (!getCustomModel()) parts.push('codeReviewer.customModel');
    if (parts.length) {
      return `Custom provider needs ${parts.join(' and ')} in Settings (API key is optional for local servers).`;
    }
    return 'Configure custom base URL and model in Settings, or enter an API key in the panel.';
  }

  return (
    `No API key for ${LABEL_BY_PROVIDER[provider]}. Enter it in the panel and click Save, ` +
    `or set codeReviewer.${KEY_BY_PROVIDER[provider]} / codeReviewer.apiKey in Settings.`
  );
}

export function settingsFilterForProvider(provider: ProviderId): string {
  return provider === 'custom' ? 'codeReviewer.custom' : `codeReviewer.${KEY_BY_PROVIDER[provider]}`;
}

export async function saveSelectedProvider(provider: ProviderId): Promise<void> {
  await vscode.workspace
    .getConfiguration('codeReviewer')
    .update('provider', provider, vscode.ConfigurationTarget.Global);
}

/** Persist key for the active provider and mirror to codeReviewer.apiKey. */
export async function saveApiKeyForProvider(
  provider: ProviderId,
  apiKey: string,
  options?: { customBaseUrl?: string; customModel?: string }
): Promise<void> {
  const config = vscode.workspace.getConfiguration('codeReviewer');
  const target = vscode.ConfigurationTarget.Global;
  const trimmed = apiKey.trim();

  await config.update(KEY_BY_PROVIDER[provider], trimmed, target);
  await config.update('apiKey', trimmed, target);

  if (provider === 'custom' && options) {
    if (options.customBaseUrl !== undefined) {
      await config.update('customBaseUrl', options.customBaseUrl.trim(), target);
    }
    if (options.customModel !== undefined) {
      await config.update('customModel', options.customModel.trim(), target);
    }
  }
}

function keyHint(key: string): string {
  if (!key) return '';
  if (key.length <= 4) return '••••';
  return `••••${key.slice(-4)}`;
}

export function getProviderPanelState(provider?: ProviderId): ProviderPanelState {
  const p = provider ?? getSelectedProvider();
  const saved = getSavedApiKeyForProvider(p);

  const customReady =
    p === 'custom' && Boolean(getCustomBaseUrl()) && Boolean(getCustomModel());

  return {
    provider: p,
    hasSavedKey: Boolean(saved) || customReady,
    keyHint: saved ? keyHint(saved) : customReady ? '(local endpoint configured)' : '',
    customBaseUrl: getCustomBaseUrl(),
    customModel: getCustomModel(),
  };
}
