import { StackDetectionResult } from '../detection/types';
import { getFrameworkGuidelines } from './python/guidelines';

export const REVIEW_SYSTEM_PROMPT = `You are a senior software engineer doing a focused code review.
Your job is to analyze the provided workspace and give feedback on EXACTLY these 4 areas — nothing else.
Be direct, specific, and actionable. Reference real file/variable names from the provided context.

When a framework is detected, apply that framework's standard layout and naming conventions — do not give generic advice that conflicts with the stack.`;

export function buildReviewUserPrompt(
  workspaceContext: string,
  stack: StackDetectionResult
): string {
  const frameworkBlock = buildFrameworkBlock(stack);

  return `${workspaceContext}

---

${frameworkBlock}

---

Review the workspace above and respond using EXACTLY this format (4 sections, no extras):

## 🗂️ File Structure
[Analyze folder organization **for the detected framework**. Call out wrong placement vs framework norms (e.g. Django apps, FastAPI routers, Flask blueprints). Give concrete fixes.]

## 📁 File Names
[Analyze file names for **framework-appropriate** patterns (e.g. Django: models.py, views.py, urls.py; FastAPI: routers/, schemas.py). Flag inconsistent casing and vague names.]

## 📝 Variable Naming
[Scan source samples. Use naming expected in this stack (snake_case for Python; Django model fields; Pydantic schema fields; etc.). Show bad → good examples.]

## 🧩 Code Modularity
[Assess separation of concerns **within this framework** — thin views/routes, services layer, no god modules, coupling between apps/routers. Cite specific files.]

Each section: 4–7 bullet points. Be specific. Use actual names from the project.`;
}

function buildFrameworkBlock(stack: StackDetectionResult): string {
  if (!stack.primary) {
    return 'FRAMEWORK CONTEXT:\nNo specific Python web framework detected. Use general Python project best practices.';
  }

  const secondaryIds = stack.secondary.map((s) => s.id);
  const guidelines = getFrameworkGuidelines(stack.primary.id, secondaryIds);

  return `FRAMEWORK CONTEXT:
The extension detected: **${stack.primary.name}** (${stack.primary.confidence} confidence).
Signals: ${stack.primary.signals.join('; ') || 'n/a'}.
${stack.secondary.length ? `Also noted: ${stack.secondary.map((s) => s.name).join(', ')}.` : ''}

Apply these stack-specific rules in every section:

${guidelines}`;
}
