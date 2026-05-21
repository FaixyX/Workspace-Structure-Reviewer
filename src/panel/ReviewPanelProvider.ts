import * as vscode from 'vscode';
import {
  getProviderPanelState,
  getSelectedProvider,
  missingKeyMessage,
  resolveConnection,
  saveApiKeyForProvider,
  saveSelectedProvider,
  settingsFilterForProvider,
} from '../config/providerConfig';
import { isProviderId, ProviderId } from '../llm/types';
import { runReview } from '../review/runReview';
import { toUsageDisplayPayload } from '../usage/formatPayload';
import { UsageSessionStore } from '../usage/sessionStore';
import { loadWebviewHtml } from './loadWebviewHtml';

export class ReviewPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeReviewer.panel';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _sessionStore: UsageSessionStore
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = loadWebviewHtml(this._extensionUri);
    this._sendInitialConfig();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'review':
          await this._handleReview(
            message.provider,
            message.apiKey,
            message.customBaseUrl,
            message.customModel
          );
          break;
        case 'saveProvider':
          if (isProviderId(message.provider)) {
            await saveSelectedProvider(message.provider);
            this._postProviderState(message.provider);
          }
          break;
        case 'saveApiKey':
          if (isProviderId(message.provider)) {
            await saveApiKeyForProvider(message.provider, message.apiKey ?? '', {
              customBaseUrl: message.customBaseUrl,
              customModel: message.customModel,
            });
            void vscode.window.showInformationMessage(
              `Code Reviewer: API key saved for ${message.provider} (and codeReviewer.apiKey).`
            );
            this._postProviderState(message.provider);
          }
          break;
        case 'openSettings':
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            settingsFilterForProvider(
              isProviderId(message.provider) ? message.provider : getSelectedProvider()
            )
          );
          break;
        case 'clearUsage':
          await this._sessionStore.clearSession();
          this.refreshUsageDisplay();
          break;
      }
    });
  }

  refreshUsageDisplay(): void {
    const session = this._sessionStore.getTotals();
    this._post({
      type: 'sessionUsage',
      session: {
        reviewCount: session.reviewCount,
        inputTokens: session.inputTokens.toLocaleString('en-US'),
        outputTokens: session.outputTokens.toLocaleString('en-US'),
        totalCost:
          session.totalUsd === 0
            ? '$0.00'
            : session.totalUsd < 0.01
              ? `$${session.totalUsd.toFixed(4)}`
              : `$${session.totalUsd.toFixed(2)}`,
      },
    });
  }

  private _sendInitialConfig(): void {
    const session = this._sessionStore.getTotals();
    const provider = getSelectedProvider();
    this._post({
      type: 'config',
      provider,
      session: {
        reviewCount: session.reviewCount,
        inputTokens: session.inputTokens.toLocaleString('en-US'),
        outputTokens: session.outputTokens.toLocaleString('en-US'),
        totalCost:
          session.totalUsd < 0.01 && session.totalUsd > 0
            ? `$${session.totalUsd.toFixed(4)}`
            : `$${session.totalUsd.toFixed(2)}`,
      },
      ...this._providerStatePayload(provider),
    });
  }

  private _postProviderState(provider: ProviderId): void {
    this._post({ type: 'providerState', ...this._providerStatePayload(provider) });
  }

  private _providerStatePayload(provider: ProviderId): Record<string, unknown> {
    const state = getProviderPanelState(provider);
    return {
      provider: state.provider,
      hasSavedKey: state.hasSavedKey,
      keyHint: state.keyHint,
      customBaseUrl: state.customBaseUrl,
      customModel: state.customModel,
    };
  }

  private async _handleReview(
    providerRaw?: string,
    inlineApiKey?: string,
    inlineBaseUrl?: string,
    inlineModel?: string
  ): Promise<void> {
    if (!this._view) return;

    const provider: ProviderId =
      providerRaw && isProviderId(providerRaw) ? providerRaw : getSelectedProvider();

    if (!vscode.workspace.workspaceFolders?.length) {
      this._post({ type: 'error', text: 'Open a workspace/folder first.' });
      return;
    }

    const connection = resolveConnection(provider, inlineApiKey, {
      customBaseUrl: inlineBaseUrl,
      customModel: inlineModel,
    });
    if (!connection) {
      this._post({ type: 'error', text: missingKeyMessage(provider) });
      return;
    }

    await runReview(provider, inlineApiKey, this._sessionStore, {
      onDetecting: () => this._post({ type: 'detecting' }),
      onDetected: (stack) =>
        this._post({
          type: 'detected',
          summary: stack.summary,
          signals: stack.primary?.signals ?? [],
        }),
      onStart: () => {
        this._post({ type: 'start' });
        this._post({ type: 'usageReset' });
      },
      onChunk: (text) => this._post({ type: 'chunk', text }),
      onUsagePreview: (review) => this._post({ type: 'usagePreview', review }),
      onUsageFinal: (usage) => this._post({ type: 'usageFinal', ...usage }),
      onDone: () => this._post({ type: 'done' }),
      onError: (text) => this._post({ type: 'error', text }),
    });
  }

  private _post(msg: Record<string, unknown>): void {
    this._view?.webview.postMessage(msg);
  }
}
