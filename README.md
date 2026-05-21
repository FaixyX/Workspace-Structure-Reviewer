# Code Reviewer — VS Code / Cursor Extension

AI-powered side panel that reviews your workspace and gives focused feedback on:

- 🗂️ **File Structure** — folder organization, missing conventions
- 📁 **File Names** — naming inconsistencies across the project
- 📝 **Variable Naming** — bad names, inconsistent casing, vague identifiers
- 🧩 **Code Modularity** — separation of concerns, god files, coupling, duplication

Powered by Claude (Anthropic).

---

## Setup

### 1. Install dependencies & build

```bash
npm install
npm run build
```

### 2. Run in dev mode (fastest way to test)

Open the `code-reviewer` folder in VS Code and press **F5**.  
A new Extension Development Host window opens with the extension loaded.

### 3. Package as `.vsix` for permanent local install

```bash
npm run package
# → outputs code-reviewer-0.0.1.vsix
```

**Install it:**
```bash
# VS Code
code --install-extension code-reviewer-0.0.1.vsix

# Cursor
cursor --install-extension code-reviewer-0.0.1.vsix
```

Or: Extensions panel → `...` menu → **Install from VSIX...**

---

## API Key

You need an [Anthropic API key](https://console.anthropic.com/).

**Option A — one-time per session:** paste it directly in the panel's input field.

**Option B — save permanently:**  
`Settings` → search `codeReviewer.apiKey` → paste your key.  
(Stored in VS Code's user settings, never sent anywhere except Anthropic's API.)

---

## How it works

1. Scans your workspace file tree (excludes `node_modules`, `.git`, `dist`, etc.)
2. Reads a sample of source files (up to 20 files, 1500 chars each)
3. Sends a structured prompt to `claude-sonnet-4-20250514`
4. Streams the response back into 4 collapsible sections in real time
