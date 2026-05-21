import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PROVIDERS } from '../llm/types';

const PROVIDER_OPTIONS_MARKER = '<!-- PROVIDER_OPTIONS -->';

export function loadWebviewHtml(extensionUri: vscode.Uri): string {
  const htmlPath = path.join(extensionUri.fsPath, 'media', 'panel.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  const options = PROVIDERS.map(
    (p) => `<option value="${p.id}">${p.label}</option>`
  ).join('\n    ');

  if (!html.includes(PROVIDER_OPTIONS_MARKER)) {
    throw new Error(`panel.html is missing ${PROVIDER_OPTIONS_MARKER}`);
  }

  return html.replace(PROVIDER_OPTIONS_MARKER, options);
}
