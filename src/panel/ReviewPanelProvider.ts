import * as vscode from 'vscode';
import {
  getSelectedProvider,
  missingKeyMessage,
  resolveApiKey,
  saveSelectedProvider,
  settingsFilterForProvider,
} from '../config/providerConfig';
import { isProviderId, ProviderId } from '../llm/types';
import { runReview } from '../review/runReview';
import { toUsageDisplayPayload } from '../usage/formatPayload';
import { UsageSessionStore } from '../usage/sessionStore';
import { getWebviewHtml } from './webviewHtml';

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

    webviewView.webview.html = getWebviewHtml();
    this._sendInitialConfig();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'review':
          await this._handleReview(message.provider, message.apiKey);
          break;
        case 'saveProvider':
          if (isProviderId(message.provider)) {
            await saveSelectedProvider(message.provider);
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
    this._post({
      type: 'config',
      provider: getSelectedProvider(),
      session: {
        reviewCount: session.reviewCount,
        inputTokens: session.inputTokens.toLocaleString('en-US'),
        outputTokens: session.outputTokens.toLocaleString('en-US'),
        totalCost:
          session.totalUsd < 0.01 && session.totalUsd > 0
            ? `$${session.totalUsd.toFixed(4)}`
            : `$${session.totalUsd.toFixed(2)}`,
      },
    });
  }

  private async _handleReview(providerRaw?: string, inlineApiKey?: string): Promise<void> {
    if (!this._view) return;

    const provider: ProviderId =
      providerRaw && isProviderId(providerRaw) ? providerRaw : getSelectedProvider();

    if (!vscode.workspace.workspaceFolders?.length) {
      this._post({ type: 'error', text: 'Open a workspace/folder first.' });
      return;
    }

    if (!resolveApiKey(provider, inlineApiKey)) {
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
