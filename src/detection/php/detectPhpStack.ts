import { Confidence, FrameworkMatch } from '../types';
import { codeigniterDetector } from './detectors/codeigniter';
import { drupalDetector } from './detectors/drupal';
import { laravelDetector } from './detectors/laravel';
import { slimDetector } from './detectors/slim';
import { symfonyDetector } from './detectors/symfony';
import { wordpressDetector } from './detectors/wordpress';
import { PhpDetector, PhpFrameworkId, PhpWorkspaceContext } from './types';

const PRIMARY_DETECTORS: PhpDetector[] = [
  laravelDetector,
  symfonyDetector,
  wordpressDetector,
  drupalDetector,
  codeigniterDetector,
  slimDetector,
];

const MIN_SCORE = 20;

function toConfidence(score: number): Confidence {
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function toMatch(detector: PhpDetector, score: number, signals: string[]): FrameworkMatch {
  return {
    id: detector.id,
    name: detector.name,
    language: 'php',
    confidence: toConfidence(score),
    score,
    signals,
  };
}

export function detectPhpStack(ctx: PhpWorkspaceContext): {
  primary: FrameworkMatch | null;
  secondary: FrameworkMatch[];
} {
  if (!ctx.hasPhpFiles) {
    return { primary: null, secondary: [] };
  }

  const ranked = PRIMARY_DETECTORS.map((d) => {
    const { score, signals } = d.detect(ctx);
    return { detector: d, score, signals };
  })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      primary: {
        id: 'php',
        name: 'PHP (general)',
        language: 'php',
        confidence: 'low',
        score: 10,
        signals: ['PHP files present; no major framework confidently detected'],
      },
      secondary: [],
    };
  }

  const top = ranked[0];
  const primary = toMatch(top.detector, top.score, top.signals);

  const secondary = ranked
    .slice(1, 3)
    .filter((r) => r.score >= top.score - 12)
    .map((r) => toMatch(r.detector, r.score, r.signals));

  return { primary, secondary };
}

export function isPhpFrameworkId(id: string): id is PhpFrameworkId {
  return (
    id === 'laravel' ||
    id === 'symfony' ||
    id === 'codeigniter' ||
    id === 'wordpress' ||
    id === 'drupal' ||
    id === 'slim' ||
    id === 'php'
  );
}
