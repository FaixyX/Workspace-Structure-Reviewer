import { Confidence, FrameworkMatch } from '../types';
import { celeryDetector } from './detectors/celery';
import { djangoDetector } from './detectors/django';
import { fastapiDetector } from './detectors/fastapi';
import { flaskDetector } from './detectors/flask';
import { starletteDetector } from './detectors/starlette';
import { PythonDetector, PythonFrameworkId, PythonWorkspaceContext } from './types';

const PRIMARY_DETECTORS: PythonDetector[] = [
  djangoDetector,
  fastapiDetector,
  flaskDetector,
  starletteDetector,
];

const SECONDARY_DETECTORS: PythonDetector[] = [celeryDetector];

const MIN_SCORE = 20;

function toConfidence(score: number): Confidence {
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function toMatch(detector: PythonDetector, score: number, signals: string[]): FrameworkMatch {
  return {
    id: detector.id,
    name: detector.name,
    language: 'python',
    confidence: toConfidence(score),
    score,
    signals,
  };
}

export function detectPythonStack(ctx: PythonWorkspaceContext): {
  primary: FrameworkMatch | null;
  secondary: FrameworkMatch[];
} {
  if (!ctx.hasPythonFiles) {
    return { primary: null, secondary: [] };
  }

  const ranked = PRIMARY_DETECTORS.map((d) => {
    const { score, signals } = d.detect(ctx);
    return { detector: d, score, signals };
  })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  const secondary = SECONDARY_DETECTORS.map((d) => {
    const { score, signals } = d.detect(ctx);
    return score >= MIN_SCORE ? toMatch(d, score, signals) : null;
  }).filter((m): m is FrameworkMatch => m !== null);

  if (ranked.length === 0) {
    return {
      primary: {
        id: 'python',
        name: 'Python (general)',
        language: 'python',
        confidence: 'low',
        score: 10,
        signals: ['Python files present; no major web framework confidently detected'],
      },
      secondary,
    };
  }

  const top = ranked[0];
  const primary = toMatch(top.detector, top.score, top.signals);

  // FastAPI projects often import starlette — prefer FastAPI when both score
  if (top.detector.id === 'starlette') {
    const fastapi = ranked.find((r) => r.detector.id === 'fastapi');
    if (fastapi && fastapi.score >= top.score - 15) {
      return {
        primary: toMatch(fastapi.detector, fastapi.score, fastapi.signals),
        secondary: [
          ...secondary,
          toMatch(top.detector, top.score, top.signals),
        ],
      };
    }
  }

  const alsoRan = ranked
    .slice(1, 3)
    .filter((r) => r.score >= top.score - 10 && r.detector.id !== primary.id)
    .map((r) => toMatch(r.detector, r.score, r.signals));

  return {
    primary,
    secondary: [...secondary, ...alsoRan],
  };
}

export function isPythonFrameworkId(id: string): id is PythonFrameworkId {
  return (
    id === 'django' ||
    id === 'fastapi' ||
    id === 'flask' ||
    id === 'starlette' ||
    id === 'celery' ||
    id === 'python'
  );
}
