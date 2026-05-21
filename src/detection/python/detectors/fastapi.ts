import { PythonDetector } from '../types';
import { depsMention, sampleMention } from '../utils';

export const fastapiDetector: PythonDetector = {
  id: 'fastapi',
  name: 'FastAPI',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.dependencyText, /\bfastapi\b/)) {
      score += 40;
      signals.push('fastapi listed in dependencies');
    }
    if (depsMention(ctx.dependencyText, /\buvicorn\b|\bhypercorn\b/)) {
      score += 10;
      signals.push('ASGI server (uvicorn/hypercorn) in dependencies');
    }
    if (sampleMention(ctx.pythonSampleText, /\bfrom fastapi\b|\bimport fastapi\b/)) {
      score += 35;
      signals.push('FastAPI imports in Python sources');
    }
    if (sampleMention(ctx.pythonSampleText, /FastAPI\s*\(/)) {
      score += 25;
      signals.push('FastAPI() app instantiation');
    }
    if (sampleMention(ctx.pythonSampleText, /@app\.(get|post|put|delete|patch|api_route)/)) {
      score += 15;
      signals.push('FastAPI route decorators');
    }
    if (sampleMention(ctx.pythonSampleText, /APIRouter\s*\(/)) {
      score += 10;
      signals.push('APIRouter usage');
    }

    return { score, signals };
  },
};
