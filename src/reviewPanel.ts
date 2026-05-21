import * as vscode from 'vscode';
import * as path from 'path';

export class ReviewPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeReviewer.panel';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'review':
          await this._runReview(message.apiKey);
          break;
        case 'openSettings':
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'codeReviewer.apiKey'
          );
          break;
      }
    });
  }

  // ─── Review orchestration ────────────────────────────────────────────────

  private async _runReview(inlineApiKey?: string) {
    if (!this._view) return;

    const config = vscode.workspace.getConfiguration('codeReviewer');
    const apiKey = inlineApiKey || config.get<string>('apiKey') || '';

    if (!apiKey) {
      this._post({ type: 'error', text: 'No API key found. Enter it above or save it in Settings (codeReviewer.apiKey).' });
      return;
    }

    if (!vscode.workspace.workspaceFolders?.length) {
      this._post({ type: 'error', text: 'Open a workspace/folder first.' });
      return;
    }

    this._post({ type: 'start' });

    try {
      const context = await this._buildWorkspaceContext();
      await this._streamClaude(apiKey, context);
    } catch (err: any) {
      this._post({ type: 'error', text: err.message ?? String(err) });
    }
  }

  // ─── Workspace scanning ──────────────────────────────────────────────────

  private async _buildWorkspaceContext(): Promise<string> {
    const root = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Collect all files, excluding noise
    const allFiles = await vscode.workspace.findFiles(
      '**/*',
      '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**,**/.next/**,**/.nuxt/**,**/coverage/**,**/__pycache__/**}'
    );

    // File tree (for structure + file name analysis)
    const fileTree = allFiles
      .map((f) => path.relative(root, f.fsPath).replace(/\\/g, '/'))
      .sort()
      .join('\n');

    // Source files for variable naming analysis (limit scope to avoid token overload)
    const SOURCE_EXTS = new Set([
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.go', '.java', '.cs',
      '.cpp', '.c', '.rb', '.php',
      '.vue', '.svelte', '.rs', '.kt', '.swift',
    ]);

    const sourceFiles = allFiles
      .filter((f) => SOURCE_EXTS.has(path.extname(f.fsPath).toLowerCase()))
      .slice(0, 20); // cap at 20 files

    let fileContents = '';
    for (const file of sourceFiles) {
      try {
        const doc = await vscode.workspace.openTextDocument(file);
        const rel = path.relative(root, file.fsPath).replace(/\\/g, '/');
        // First 1500 chars per file is enough for naming patterns
        fileContents += `\n\n=== ${rel} ===\n${doc.getText().slice(0, 1500)}`;
      } catch {
        // skip unreadable files
      }
    }

    return `PROJECT FILE TREE:\n${fileTree}\n\nSOURCE FILE SAMPLES:${fileContents}`;
  }

  // ─── Claude API (streaming) ──────────────────────────────────────────────

  private async _streamClaude(apiKey: string, workspaceContext: string) {
    const systemPrompt = `You are a senior software engineer doing a focused code review.
Your job is to analyze the provided workspace and give feedback on EXACTLY these 4 areas — nothing else.
Be direct, specific, and actionable. Reference real file/variable names from the provided context.`;

    const userPrompt = `${workspaceContext}

---

Review the workspace above and respond using EXACTLY this format (4 sections, no extras):

## 🗂️ File Structure
[Analyze the overall folder and file organization. Call out missing folders, wrong placement, overly deep nesting, missing index files, etc. Give concrete fixes.]

## 📁 File Names
[Analyze file names across the project. Flag inconsistent casing (e.g. mixing camelCase and kebab-case), vague names like utils.ts or helpers.js, missing convention, etc. Suggest better names.]

## 📝 Variable Naming
[Scan the source code samples. Point out bad variable/function/class names — vague names, Hungarian notation, inconsistent casing, single-letter vars outside loops, etc. Show bad → good examples.]

## 🧩 Code Modularity
[From the file tree and source samples, assess separation of concerns: god files, mixed responsibilities, duplicated logic, tight coupling, missing boundaries (utils vs domain vs UI), and when modules should be split or merged. Cite specific files.]

Each section: 4–7 bullet points. Be specific. Use the actual names from the project.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2800,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      let msg = `API error ${response.status}`;
      try {
        const body = (await response.json()) as any;
        msg = body?.error?.message ?? msg;
      } catch {}
      throw new Error(msg);
    }

    if (!response.body) throw new Error('No response body from API.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;

        try {
          const parsed = JSON.parse(raw);
          if (
            parsed.type === 'content_block_delta' &&
            parsed.delta?.type === 'text_delta'
          ) {
            this._post({ type: 'chunk', text: parsed.delta.text });
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    this._post({ type: 'done' });
  }

  // ─── Helper ──────────────────────────────────────────────────────────────

  private _post(msg: Record<string, unknown>) {
    this._view?.webview.postMessage(msg);
  }

  // ─── Webview HTML ────────────────────────────────────────────────────────

  private _getHtmlForWebview(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code Reviewer</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 10px 12px 20px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
  }
  .header-title { font-size: 13px; font-weight: 600; }
  .header-sub { font-size: 10px; color: var(--vscode-descriptionForeground); margin-top: 1px; }

  /* ── API key row ── */
  .api-row {
    display: flex;
    gap: 5px;
    margin-bottom: 8px;
  }

  input[type="password"], input[type="text"] {
    flex: 1;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: inherit;
    min-width: 0;
  }
  input:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }
  input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .icon-btn {
    background: var(--vscode-button-secondaryBackground, #3c3c3c);
    color: var(--vscode-button-secondaryForeground, #ccc);
    border: none;
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 13px;
    cursor: pointer;
    line-height: 1;
    flex-shrink: 0;
  }
  .icon-btn:hover { background: var(--vscode-button-secondaryHoverBackground, #505050); }

  .hint {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 10px;
  }
  .hint a { color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: none; }
  .hint a:hover { text-decoration: underline; }

  /* ── Review button ── */
  #reviewBtn {
    width: 100%;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 3px;
    padding: 7px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s;
  }
  #reviewBtn:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
  #reviewBtn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Progress bar ── */
  .progress-track {
    height: 2px;
    background: var(--vscode-editorWidget-border, #444);
    border-radius: 1px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    width: 0;
    background: var(--vscode-progressBar-background, #0078d4);
    border-radius: 1px;
    transition: width 0.3s;
  }
  .progress-fill.running {
    width: 40%;
    animation: progress-slide 1.4s ease-in-out infinite alternate;
  }
  @keyframes progress-slide {
    from { margin-left: 0; width: 40%; }
    to { margin-left: 60%; width: 40%; }
  }

  /* ── Error ── */
  #errorBox {
    display: none;
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
    border-radius: 3px;
    padding: 6px 10px;
    font-size: 11px;
    color: var(--vscode-errorForeground, #f48771);
    margin-bottom: 10px;
    line-height: 1.5;
  }

  /* ── Sections ── */
  .section {
    border: 1px solid var(--vscode-panel-border, #333);
    border-radius: 4px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    background: var(--vscode-editor-inactiveSelectionBackground, #2a2d2e);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    line-height: 1;
  }
  .section-header:hover { background: var(--vscode-list-hoverBackground, #2a2d2e); }

  .chevron {
    margin-left: auto;
    font-size: 9px;
    color: var(--vscode-descriptionForeground);
    transition: transform 0.15s;
  }
  .section.collapsed .chevron { transform: rotate(-90deg); }
  .section.collapsed .section-body { display: none; }

  .section-body {
    padding: 10px;
    background: var(--vscode-editor-background);
    font-size: 11.5px;
    line-height: 1.65;
    color: var(--vscode-editor-foreground);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .section-body .placeholder {
    color: var(--vscode-descriptionForeground);
    font-style: italic;
    font-size: 11px;
  }

  /* streaming cursor */
  .cursor {
    display: inline-block;
    width: 2px;
    height: 12px;
    background: var(--vscode-foreground);
    vertical-align: text-bottom;
    animation: blink 1s step-end infinite;
    margin-left: 1px;
  }
  @keyframes blink { 50% { opacity: 0; } }
</style>
</head>
<body>

<div class="header">
  <span style="font-size:18px">🔍</span>
  <div>
    <div class="header-title">Code Reviewer</div>
    <div class="header-sub">Structure · Files · Variables · Modularity</div>
  </div>
</div>

<div class="api-row">
  <input type="password" id="apiKeyInput" placeholder="sk-ant-api… (or save in Settings)" />
  <button class="icon-btn" title="Open Settings" onclick="openSettings()">⚙</button>
</div>
<div class="hint">
  Key is never stored here. Save it permanently via
  <a onclick="openSettings()">Settings → codeReviewer.apiKey</a>.
</div>

<button id="reviewBtn" onclick="startReview()">
  <span id="btnIcon">▶</span>
  <span id="btnLabel">Review Workspace</span>
</button>

<div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>

<div id="errorBox"></div>

<!-- Section 1 -->
<div class="section" id="sec-structure">
  <div class="section-header" onclick="toggleSection('structure')">
    <span>🗂️</span> File Structure
    <span class="chevron">▼</span>
  </div>
  <div class="section-body" id="body-structure">
    <span class="placeholder">Run a review to see results…</span>
  </div>
</div>

<!-- Section 2 -->
<div class="section" id="sec-files">
  <div class="section-header" onclick="toggleSection('files')">
    <span>📁</span> File Names
    <span class="chevron">▼</span>
  </div>
  <div class="section-body" id="body-files">
    <span class="placeholder">Run a review to see results…</span>
  </div>
</div>

<!-- Section 3 -->
<div class="section" id="sec-naming">
  <div class="section-header" onclick="toggleSection('naming')">
    <span>📝</span> Variable Naming
    <span class="chevron">▼</span>
  </div>
  <div class="section-body" id="body-naming">
    <span class="placeholder">Run a review to see results…</span>
  </div>
</div>

<!-- Section 4 -->
<div class="section" id="sec-modularity">
  <div class="section-header" onclick="toggleSection('modularity')">
    <span>🧩</span> Code Modularity
    <span class="chevron">▼</span>
  </div>
  <div class="section-body" id="body-modularity">
    <span class="placeholder">Run a review to see results…</span>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  let fullText = '';
  let isStreaming = false;

  // ── Collapse/expand sections ──────────────────────────────────────────────
  function toggleSection(id) {
    document.getElementById('sec-' + id).classList.toggle('collapsed');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function startReview() {
    if (isStreaming) return;
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    vscode.postMessage({ command: 'review', apiKey });
  }

  function openSettings() {
    vscode.postMessage({ command: 'openSettings' });
  }

  // ── UI state helpers ──────────────────────────────────────────────────────
  function setLoading(active) {
    isStreaming = active;
    document.getElementById('reviewBtn').disabled = active;
    document.getElementById('btnIcon').textContent = active ? '⏳' : '▶';
    document.getElementById('btnLabel').textContent = active ? 'Reviewing…' : 'Review Workspace';
    document.getElementById('progressFill').className = active ? 'progress-fill running' : 'progress-fill';
  }

  function showError(msg) {
    const el = document.getElementById('errorBox');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideError() {
    document.getElementById('errorBox').style.display = 'none';
  }

  function setPlaceholders(text) {
    ['structure', 'files', 'naming', 'modularity'].forEach(id => {
      const el = document.getElementById('body-' + id);
      el.innerHTML = '<span class="placeholder">' + text + '</span>';
    });
  }

  // ── Stream parsing ────────────────────────────────────────────────────────
  // Claude streams text in chunks; we accumulate and re-parse on each chunk.
  function parseSections(text) {
    const SECTIONS = [
      { key: 'structure',  marker: '## 🗂️ File Structure' },
      { key: 'files',      marker: '## 📁 File Names' },
      { key: 'naming',     marker: '## 📝 Variable Naming' },
      { key: 'modularity', marker: '## 🧩 Code Modularity' },
    ];

    for (let i = 0; i < SECTIONS.length; i++) {
      const start = text.indexOf(SECTIONS[i].marker);
      if (start === -1) continue;

      const contentStart = text.indexOf('\\n', start) + 1;
      const end = i + 1 < SECTIONS.length
        ? text.indexOf(SECTIONS[i + 1].marker)
        : text.length;

      const content = text.slice(contentStart, end === -1 ? text.length : end).trim();
      if (!content) continue;

      const el = document.getElementById('body-' + SECTIONS[i].key);
      // Show blinking cursor only on the currently-streaming section
      const isLast = (end === -1 || end === text.length) && isStreaming;
      el.innerHTML = escapeHtml(content) + (isLast ? '<span class="cursor"></span>' : '');
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Message handler ───────────────────────────────────────────────────────
  window.addEventListener('message', (event) => {
    const msg = event.data;

    if (msg.type === 'start') {
      fullText = '';
      hideError();
      setLoading(true);
      setPlaceholders('Analyzing workspace…');
    }

    if (msg.type === 'chunk') {
      fullText += msg.text;
      parseSections(fullText);
    }

    if (msg.type === 'done') {
      setLoading(false);
      parseSections(fullText);
    }

    if (msg.type === 'error') {
      setLoading(false);
      showError(msg.text);
    }
  });
</script>
</body>
</html>`;
  }
}
