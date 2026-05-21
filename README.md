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
2. **Detects project framework** (Python and JavaScript/TypeScript stacks) from manifests, paths, and source patterns
3. Reads dependency manifests + a sample of source files
4. Sends a **framework-aware** prompt to your selected LLM (Claude, OpenAI, or Gemini)
5. Streams the response into 4 collapsible sections in real time

### Framework detection

**Python**

| Framework | Signals (examples) |
|-----------|-------------------|
| **Django** | `manage.py`, `settings.py`, `django` in requirements |
| **FastAPI** | `fastapi` dep, `FastAPI()`, `APIRouter` |
| **Flask** | `flask` dep, `Flask(__name__)`, Blueprints |
| **Starlette** | Often secondary to FastAPI |
| **Celery** | Related stack when detected |
| **Python (general)** | `.py` without a strong web framework match |

**JavaScript / TypeScript**

| Framework | Signals (examples) |
|-----------|-------------------|
| **Next.js** | `next` dep, `next.config`, `app/` or `pages/` |
| **React** | `react` dep, `.tsx`/`.jsx`, component patterns |
| **Vue** | `vue` dep, `.vue` SFCs, `createApp` |
| **Nuxt** | `nuxt` dep, `nuxt.config`, `pages/` |
| **Angular** | `@angular/core`, `angular.json`, `@Component` |
| **NestJS** | `@nestjs/core`, `@Module`, `NestFactory` |
| **Express** | `express` dep, `app.get` / routers |
| **Svelte** | `svelte` / SvelteKit, `.svelte` files |
| **Node (general)** | `package.json` without a strong framework match |

Monorepos with both Python and JS pick the **highest-confidence** primary framework; others appear as related stacks.

Add detectors under `src/detection/python/detectors/` and `src/detection/javascript/detectors/`.

## Project structure

```
src/
  extension.ts              # Activation entry
  panel/                    # Webview UI
  config/                   # Settings & API keys
  workspace/                # File tree & sampling
  detection/                # Framework detection
    shared/                 # Manifest parsing, path utils
    python/detectors/        # Django, FastAPI, Flask, …
    javascript/detectors/   # Next.js, React, Vue, NestJS, …
  prompts/
    python/                 # Python framework rules
    javascript/             # JS/TS framework rules
  llm/                      # Provider streaming (Claude, OpenAI, Gemini)
  review/                   # Review orchestration
```
