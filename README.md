# Code Reviewer

**Framework-aware AI workspace reviews** for VS Code and Cursor — structure, naming, modularity, and estimated API spend in one side panel.

Bring your own API key (Claude, OpenAI, or Gemini). The extension scans your project, detects your stack, and streams actionable feedback into four focused sections.

---

## Features

### Four review dimensions

| Section | What it checks |
|--------|----------------|
| **File structure** | Folder layout vs framework norms (apps, routers, blueprints, `src/`) |
| **File names** | Casing, vague names (`utils.ts`), convention consistency |
| **Variable naming** | Identifiers in sampled source — clarity, casing, patterns |
| **Code modularity** | God files, coupling, missing layers, split/merge suggestions |

### Framework detection

Reviews adapt to **your** stack — not generic advice that fights Django or Next.js conventions.

**Python:** Django, FastAPI, Flask, Starlette, Celery (related), or general Python  

**JavaScript / TypeScript:** Next.js, React, Vue, Nuxt, Angular, NestJS, Express, Svelte / SvelteKit, or general Node  

Monorepos with multiple ecosystems pick the strongest match; related frameworks are listed as secondary signals.

### Multi-provider LLM support

| Provider | Model used | Settings key |
|----------|------------|----------------|
| [Claude](https://console.anthropic.com/) | Claude Sonnet 4 | `codeReviewer.claudeApiKey` |
| [OpenAI](https://platform.openai.com/api-keys) | GPT-4o mini | `codeReviewer.openaiApiKey` |
| [Gemini](https://aistudio.google.com/apikey) | Gemini 2.0 Flash | `codeReviewer.geminiApiKey` |

Set default provider: `codeReviewer.provider` → `claude` | `openai` | `gemini`

### Usage & cost tracking

After each review, see:

- Input and output **token counts** (from the provider API when available)
- **Estimated USD cost** per review (list-price based; not a bill)
- **Session totals** across reviews (stored locally in VS Code)

Live estimates update while the response streams. Use **Reset session** in the panel or run **Code Reviewer: Reset Usage Session Totals** from the Command Palette.

> Costs are estimates only — confirm spend on your Anthropic, OpenAI, or Google Cloud dashboard.

---

## Quick start

1. Install the extension (VSIX or Marketplace).
2. Open a **workspace folder** (not just a single file).
3. Click the **Code Reviewer** icon in the activity bar.
4. Choose your **LLM provider** and paste an API key (or save it in Settings).
5. Click **Review Workspace**.

Results stream into collapsible sections. Framework detection appears in a badge above the review.

---

## Configuration

Open **Settings** and search `codeReviewer`:

```json
{
  "codeReviewer.provider": "claude",
  "codeReviewer.claudeApiKey": "sk-ant-...",
  "codeReviewer.openaiApiKey": "",
  "codeReviewer.geminiApiKey": ""
}
```

**Per-session keys:** paste in the panel input — not stored in the webview after reload.

**Saved keys:** stored in VS Code **user settings** only; sent directly to the provider you select, not to any third-party server run by this extension.

Legacy `codeReviewer.apiKey` still maps to Claude for backward compatibility.

---

## How it works

1. Scans the file tree (skips `node_modules`, `.git`, `dist`, `.venv`, build output, etc.).
2. Reads `package.json`, `requirements.txt`, `pyproject.toml`, and similar manifests.
3. Samples source files for naming and modularity patterns.
4. Detects the primary framework and injects stack-specific rules into the prompt.
5. Streams the LLM response into four markdown sections.
6. Records token usage and estimated cost for the review and session.

---

## Supported frameworks (detection signals)

<details>
<summary><strong>Python</strong></summary>

| Framework | Examples |
|-----------|----------|
| Django | `manage.py`, `settings.py`, `django` in deps, `INSTALLED_APPS` |
| FastAPI | `fastapi`, `FastAPI()`, `APIRouter` |
| Flask | `flask`, `Flask(__name__)`, Blueprints |
| Starlette | Often secondary to FastAPI |
| Celery | Related stack when tasks/broker detected |
| Python (general) | `.py` without a strong web framework match |

</details>

<details>
<summary><strong>JavaScript / TypeScript</strong></summary>

| Framework | Examples |
|-----------|----------|
| Next.js | `next`, `next.config`, `app/` or `pages/` |
| React | `react`, `.tsx` / `.jsx`, hooks and components |
| Vue | `vue`, `.vue` SFCs, `createApp` |
| Nuxt | `nuxt`, `nuxt.config` |
| Angular | `@angular/core`, `angular.json` |
| NestJS | `@nestjs/core`, `@Module` |
| Express | `express`, routers and middleware |
| Svelte | `svelte`, SvelteKit, `.svelte` |
| Node (general) | `package.json` without a strong framework match |

</details>

---

## Commands

| Command | Description |
|---------|-------------|
| **Code Reviewer: Reset Usage Session Totals** | Clears persisted token/cost session counters |

---

## Development

```bash
npm install
npm run build      # compile extension
npm run watch      # rebuild on change
npm run package    # produce .vsix
```

Press **F5** in VS Code with this folder open to launch an Extension Development Host.

### Project layout

```
src/
  extension.ts           # Activation
  panel/                 # Webview UI
  config/                # Provider settings
  workspace/             # Scan & context building
  detection/             # Python & JS/TS framework detectors
  prompts/               # Framework-aware LLM prompts
  llm/                   # Claude, OpenAI, Gemini streaming
  usage/                 # Tokens, pricing, session totals
  review/                # Review orchestration
```

Extend detection: add files under `src/detection/python/detectors/` or `src/detection/javascript/detectors/`, then register guidelines in `src/prompts/`.

---

## Privacy

- API keys stay in your editor settings or session input.
- Workspace file paths and code **samples** are sent to **your chosen LLM provider** when you run a review.
- No analytics or telemetry are sent to the extension publisher by this codebase.

---

## Disclaimer

AI suggestions are starting points — validate before large refactors. Estimated costs may differ from your provider invoice.

---

## Repository

https://github.com/FaixyX/code_reviewer_extension
