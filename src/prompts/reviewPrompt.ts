import { StackDetectionResult } from '../detection/types';
import { getFrameworkGuidelines } from './frameworkGuidelines';

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
[Analyze folder organization **for the detected framework**. Call out wrong placement vs framework norms (e.g. Django apps, Next.js app/, NestJS modules). Give concrete fixes.]

## 📁 File Names
[Analyze file names for **framework-appropriate** patterns (e.g. Django: models.py; React: PascalCase components; Next.js: app/route segments). Flag inconsistent casing and vague names.]

## 📝 Variable Naming
[Scan source samples. Use naming expected in this stack (snake_case for Python; camelCase/PascalCase for TS/JS; React hooks useXxx; etc.). Show bad → good examples.]

## 🧩 Code Modularity
[Assess separation of concerns **within this framework** — thin routes/handlers, services layer, feature folders, no god modules. Cite specific files.]

Each section: 4–7 bullet points. Be specific. Use actual names from the project.`;
}

function buildFrameworkBlock(stack: StackDetectionResult): string {
  if (!stack.primary) {
    return 'FRAMEWORK CONTEXT:\nNo specific framework detected. Use general best practices for the languages present in the project.';
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
