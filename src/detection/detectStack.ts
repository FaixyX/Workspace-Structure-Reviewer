import { detectJavaScriptStack } from './javascript/detectJavaScriptStack';
import { JavaScriptWorkspaceContext } from './javascript/types';
import { detectPythonStack } from './python/detectPythonStack';
import { PythonWorkspaceContext } from './python/types';
import { FrameworkMatch, StackDetectionResult } from './types';

export interface DetectionInput {
  relativePaths: string[];
  manifestText: string;
  pythonSampleText: string;
  javascriptSampleText: string;
  hasPythonFiles: boolean;
  hasJavaScriptFiles: boolean;
}

interface EcosystemResult {
  primary: FrameworkMatch | null;
  secondary: FrameworkMatch[];
}

function mergeEcosystemResults(results: EcosystemResult[]): StackDetectionResult {
  const primaries = results
    .map((r) => r.primary)
    .filter((p): p is FrameworkMatch => p !== null)
    .sort((a, b) => b.score - a.score);

  if (primaries.length === 0) {
    return {
      language: 'unknown',
      primary: null,
      secondary: [],
      summary: 'No supported framework detected — reviews use general best practices.',
    };
  }

  const primary = primaries[0];
  const language =
    primaries.length > 1 && primaries[0].language !== primaries[1].language
      ? 'polyglot'
      : primary.language;

  const secondary: FrameworkMatch[] = [];
  const seen = new Set<string>([primary.id]);

  for (const r of results) {
    for (const s of r.secondary) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        secondary.push(s);
      }
    }
    if (r.primary && r.primary.id !== primary.id && !seen.has(r.primary.id)) {
      seen.add(r.primary.id);
      secondary.push(r.primary);
    }
  }

  const secondaryNames = secondary.map((s) => s.name);
  const suffix =
    secondaryNames.length > 0 ? ` (also: ${secondaryNames.join(', ')})` : '';

  const langLabel =
    language === 'polyglot'
      ? 'Polyglot'
      : language === 'python'
        ? 'Python'
        : 'JavaScript/TypeScript';

  return {
    language,
    primary,
    secondary,
    summary: `${langLabel} · ${primary.name} (${primary.confidence} confidence)${suffix}`,
  };
}

export function detectStack(input: DetectionInput): StackDetectionResult {
  const results: EcosystemResult[] = [];

  if (input.hasPythonFiles) {
    const pyCtx: PythonWorkspaceContext = {
      relativePaths: input.relativePaths,
      dependencyText: input.manifestText,
      pythonSampleText: input.pythonSampleText,
      hasPythonFiles: true,
    };
    results.push(detectPythonStack(pyCtx));
  }

  if (input.hasJavaScriptFiles) {
    const jsCtx: JavaScriptWorkspaceContext = {
      relativePaths: input.relativePaths,
      manifestText: input.manifestText,
      javascriptSampleText: input.javascriptSampleText,
      hasJavaScriptFiles: true,
    };
    results.push(detectJavaScriptStack(jsCtx));
  }

  if (results.length === 0) {
    return {
      language: 'unknown',
      primary: null,
      secondary: [],
      summary: 'No Python or JavaScript/TypeScript project detected — reviews use general best practices.',
    };
  }

  return mergeEcosystemResults(results);
}
