import * as vscode from 'vscode';
import { ReviewPanelProvider } from './panel/ReviewPanelProvider';
import { UsageSessionStore } from './usage/sessionStore';

export function activate(context: vscode.ExtensionContext) {
  const sessionStore = new UsageSessionStore(context.globalState);
  const provider = new ReviewPanelProvider(context.extensionUri, sessionStore);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ReviewPanelProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.commands.registerCommand('codeReviewer.clearUsageSession', async () => {
      const totals = await sessionStore.clearSession();
      vscode.window.showInformationMessage(
        `Code Reviewer usage reset (${totals.reviewCount} reviews cleared).`
      );
      provider.refreshUsageDisplay();
    })
  );
}

export function deactivate() {}
