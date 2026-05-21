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
import { getWebviewHtml } from './webviewHtml';

export class ReviewPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeReviewer.panel';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
    this._post({ type: 'config', provider: getSelectedProvider() });

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
      }
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

    await runReview(provider, inlineApiKey, {
      onDetecting: () => this._post({ type: 'detecting' }),
      onDetected: (stack) =>
        this._post({
          type: 'detected',
          summary: stack.summary,
          signals: stack.primary?.signals ?? [],
        }),
      onStart: () => this._post({ type: 'start' }),
      onChunk: (text) => this._post({ type: 'chunk', text }),
      onDone: () => this._post({ type: 'done' }),
      onError: (text) => this._post({ type: 'error', text }),
    });
  }

  private _post(msg: Record<string, unknown>): void {
    this._view?.webview.postMessage(msg);
  }
}
