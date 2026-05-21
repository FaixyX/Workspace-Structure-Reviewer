import { PythonDetector } from '../types';
import { depsMention, sampleMention } from '../utils';

/** Starlette is often used standalone or under FastAPI */
export const starletteDetector: PythonDetector = {
  id: 'starlette',
  name: 'Starlette',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.dependencyText, /\bstarlette\b/)) {
      score += 30;
      signals.push('starlette listed in dependencies');
    }
    if (sampleMention(ctx.pythonSampleText, /\bfrom starlette\b|\bimport starlette\b/)) {
      score += 30;
      signals.push('Starlette imports in Python sources');
    }
    if (sampleMention(ctx.pythonSampleText, /Starlette\s*\(/)) {
      score += 20;
      signals.push('Starlette() app pattern');
    }

    return { score, signals };
  },
};
