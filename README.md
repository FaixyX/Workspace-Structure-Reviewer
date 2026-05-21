# Code Reviewer — VS Code / Cursor Extension

AI-powered side panel that reviews your workspace and gives focused feedback on:

- 🗂️ **File Structure** — folder organization, missing conventions
- 📁 **File Names** — naming inconsistencies across the project
- 📝 **Variable Naming** — bad names, inconsistent casing, vague identifiers
- 🧩 **Code Modularity** — separation of concerns, god files, coupling, duplication

Works with **Claude**, **OpenAI**, or **Gemini** — you choose the provider and bring your own API key.

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

## LLM provider & API keys

Pick a provider in the panel dropdown, then add the matching key:

| Provider | Get a key | Settings key |
|----------|-----------|--------------|
| Claude | [console.anthropic.com](https://console.anthropic.com/) | `codeReviewer.claudeApiKey` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `codeReviewer.openaiApiKey` |
| Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | `codeReviewer.geminiApiKey` |

**Option A — per session:** paste the key in the panel (not saved in the webview).

**Option B — save permanently:**  
`Settings` → search `codeReviewer` → set `codeReviewer.provider` and the API key for your provider.  
Keys are stored in VS Code user settings and sent only to that provider's API.

The legacy setting `codeReviewer.apiKey` still works as a fallback for Claude.

---

## How it works

1. Scans your workspace file tree (excludes `node_modules`, `.git`, `dist`, `.venv`, etc.)
2. **Detects Python framework** (Django, FastAPI, Flask, Starlette, or general Python) from dependencies, paths, and source patterns
3. Reads dependency manifests + a sample of source files
4. Sends a **framework-aware** prompt to your selected LLM (Claude, OpenAI, or Gemini)
5. Streams the response into 4 collapsible sections in real time

### Python framework detection (v1)

| Framework | Signals (examples) |
|-----------|-------------------|
| **Django** | `manage.py`, `settings.py`, `django` in requirements, `INSTALLED_APPS` |
| **FastAPI** | `fastapi` dep, `FastAPI()`, route decorators, `APIRouter` |
| **Flask** | `flask` dep, `Flask(__name__)`, `@app.route`, Blueprints |
| **Starlette** | `starlette` dep (often secondary to FastAPI) |
| **Celery** | Listed as related stack when detected |
| **Python (general)** | `.py` files but no strong web framework match |

More frameworks and languages can be added under `src/detection/`.

## Project structure

```
src/
  extension.ts              # Activation entry
  panel/                    # Webview UI
  config/                   # Settings & API keys
  workspace/                # File tree & sampling
  detection/                # Framework detection
    python/
      detectors/            # Django, FastAPI, Flask, …
  prompts/                  # LLM prompts & per-framework rules
  llm/                      # Provider streaming (Claude, OpenAI, Gemini)
  review/                   # Review orchestration
```
