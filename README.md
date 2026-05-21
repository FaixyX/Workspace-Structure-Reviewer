# Code Reviewer

**Framework-aware AI workspace reviews** for VS Code and Cursor — file structure, naming, modularity, and estimated API spend in one side panel.

Detects **Python, JavaScript/TypeScript, and PHP** stacks (Django, Next.js, Laravel, and more), then streams tailored feedback into four collapsible sections.

---

## Setup — API keys

Choose a provider in the activity bar panel, then add a key:

| Provider | Get a key | Settings |
|----------|-----------|----------|
| **Claude** | [console.anthropic.com](https://console.anthropic.com/) | `codeReviewer.claudeApiKey` |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | `codeReviewer.openaiApiKey` |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com/apikey) | `codeReviewer.geminiApiKey` |
| **Custom / local** | Ollama, LM Studio, vLLM, etc. | `codeReviewer.customBaseUrl`, `codeReviewer.customModel`, optional `codeReviewer.customApiKey` |

**Save in Settings**

- Paste your key in the panel → click **Save API key to Settings**
- Writes **`codeReviewer.apiKey`** (active key) **and** the key for the selected provider
- Or edit directly: **Settings** → search `codeReviewer`

**Per-session use:** paste a key in the panel without saving — it is used for that review only.

**Local model (Ollama):** provider **Custom / Local**, base URL `http://localhost:11434/v1`, model e.g. `llama3.2`, API key usually empty.

Keys stay in VS Code user settings. Reviews send workspace samples only to **your chosen API** (Anthropic, OpenAI, Google, or your local server) — not to the extension author.

---

## How it works

1. Scans your workspace file tree (excludes `node_modules`, `.git`, `dist`, `.venv`, etc.).
2. Reads dependency manifests (`package.json`, `composer.json`, `requirements.txt`, …).
3. Samples source files for naming and modularity (up to 20 files).
4. **Detects your framework** (e.g. FastAPI, Next.js, Laravel) and applies stack-specific review rules.
5. Sends a structured prompt to **your selected model:**
   - Claude → Sonnet 4  
   - OpenAI → GPT-4o mini  
   - Gemini → 2.0 Flash  
   - Custom → any OpenAI-compatible local/cloud endpoint  
6. Streams the response into **4 sections** in real time and shows **token usage / estimated cost**.

---

## Quick start

1. Open a **workspace folder**.
2. Click the **Code Reviewer** icon in the activity bar.
3. Select provider, enter API key (or use a saved key), click **Save** if you want it in Settings.
4. Click **Review Workspace**.

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

| Ecosystem | Frameworks |
|-----------|------------|
| **Python** | Django, FastAPI, Flask, Starlette, Celery (related), general Python |
| **JavaScript / TypeScript** | Next.js, React, Vue, Nuxt, Angular, NestJS, Express, SvelteKit, general Node |
| **PHP** | Laravel, Symfony, CodeIgniter, WordPress, Drupal, Slim, general PHP |

Monorepos: highest-confidence framework wins; others listed as related.

### Usage & cost tracking

- Input/output **tokens** (from API when available, else estimated)
- **Estimated USD** per review (list prices; not a bill)
- **Session totals** (local) — reset via panel or **Code Reviewer: Reset Usage Session Totals**

---

## Configuration example

```json
{
  "codeReviewer.provider": "claude",
  "codeReviewer.apiKey": "your-active-key",
  "codeReviewer.claudeApiKey": "sk-ant-...",
  "codeReviewer.openaiApiKey": "sk-...",
  "codeReviewer.geminiApiKey": "AIza...",
  "codeReviewer.customBaseUrl": "http://localhost:11434/v1",
  "codeReviewer.customModel": "llama3.2",
  "codeReviewer.customApiKey": ""
}
```

---

## Supported frameworks (detection signals)

<details>
<summary><strong>Python</strong></summary>

| Framework | Examples |
|-----------|----------|
| Django | `manage.py`, `settings.py`, `django` in deps |
| FastAPI | `fastapi`, `FastAPI()`, `APIRouter` |
| Flask | `flask`, `Flask(__name__)`, Blueprints |
| Starlette | Often secondary to FastAPI |
| Celery | Tasks/broker detected |
| Python (general) | `.py` without a strong web framework match |

</details>

<details>
<summary><strong>JavaScript / TypeScript</strong></summary>

| Framework | Examples |
|-----------|----------|
| Next.js | `next`, `next.config`, `app/` or `pages/` |
| React | `react`, `.tsx` / `.jsx` |
| Vue / Nuxt | `.vue`, `nuxt.config` |
| Angular | `@angular/core`, `angular.json` |
| NestJS / Express | `@nestjs/core`, `express` routes |
| Svelte | SvelteKit, `.svelte` |
| Node (general) | `package.json` only |

</details>

<details>
<summary><strong>PHP</strong></summary>

| Framework | Examples |
|-----------|----------|
| Laravel | `artisan`, `laravel/framework`, `app/Http/Controllers` |
| Symfony | `symfony/*`, `config/packages`, `#[Route]` |
| CodeIgniter | `codeigniter4`, `app/Controllers` |
| WordPress | `wp-config.php`, `wp-content/` |
| Drupal | `drupal/core`, `sites/default` |
| Slim | `slim/slim`, PSR-7 routes |
| PHP (general) | `.php` + Composer, no strong match |

</details>

---

## Commands

| Command | Description |
|---------|-------------|
| **Code Reviewer: Reset Usage Session Totals** | Clears persisted token/cost counters |

---

## Development

```bash
npm install
npm run build
npm run package   # → code-reviewer-0.1.0.vsix
```

Press **F5** to run in Extension Development Host.

---

## Privacy

- API keys in VS Code settings or panel session only.
- Code samples sent to **your** LLM endpoint when you run a review.
- No telemetry to the extension publisher.

---

## Repository

https://github.com/FaixyX/code_reviewer_extension
