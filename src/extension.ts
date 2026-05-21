import * as vscode from 'vscode';
import { ReviewPanelProvider } from './reviewPanel';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ReviewPanelProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ReviewPanelProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate() {}
