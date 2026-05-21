import { StackDetectionResult } from './types';
import { detectPythonStack } from './python/detectPythonStack';
import { PythonWorkspaceContext } from './python/types';

export interface DetectionInput {
  relativePaths: string[];
  dependencyText: string;
  pythonSampleText: string;
  hasPythonFiles: boolean;
}

export function detectStack(input: DetectionInput): StackDetectionResult {
  const pyCtx: PythonWorkspaceContext = {
    relativePaths: input.relativePaths,
    dependencyText: input.dependencyText,
    pythonSampleText: input.pythonSampleText,
    hasPythonFiles: input.hasPythonFiles,
  };

  const { primary, secondary } = detectPythonStack(pyCtx);

  if (!primary) {
    return {
      language: 'unknown',
      primary: null,
      secondary: [],
      summary: 'No Python project detected yet — reviews use general best practices.',
    };
  }

  const secondaryNames = secondary.map((s) => s.name).filter((n) => n !== primary.name);
  const suffix =
    secondaryNames.length > 0 ? ` (also: ${secondaryNames.join(', ')})` : '';

  return {
    language: 'python',
    primary,
    secondary,
    summary: `Python · ${primary.name} (${primary.confidence} confidence)${suffix}`,
  };
}
