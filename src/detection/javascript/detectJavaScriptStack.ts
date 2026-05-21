import { Confidence, FrameworkMatch } from '../types';
import { angularDetector } from './detectors/angular';
import { expressDetector } from './detectors/express';
import { nestjsDetector } from './detectors/nestjs';
import { nextjsDetector } from './detectors/nextjs';
import { nuxtDetector } from './detectors/nuxt';
import { reactDetector } from './detectors/react';
import { svelteDetector } from './detectors/svelte';
import { vueDetector } from './detectors/vue';
import { JavaScriptDetector, JavaScriptFrameworkId, JavaScriptWorkspaceContext } from './types';

const PRIMARY_DETECTORS: JavaScriptDetector[] = [
  nextjsDetector,
  nuxtDetector,
  angularDetector,
  vueDetector,
  reactDetector,
  svelteDetector,
  nestjsDetector,
  expressDetector,
];

const MIN_SCORE = 20;

/** Meta-frameworks that subsume React — prefer when scores are close */
const PREFER_OVER_REACT: JavaScriptFrameworkId[] = ['nextjs', 'nuxt'];

function toConfidence(score: number): Confidence {
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function toMatch(detector: JavaScriptDetector, score: number, signals: string[]): FrameworkMatch {
  return {
    id: detector.id,
    name: detector.name,
    language: 'javascript',
    confidence: toConfidence(score),
    score,
    signals,
  };
}

export function detectJavaScriptStack(ctx: JavaScriptWorkspaceContext): {
  primary: FrameworkMatch | null;
  secondary: FrameworkMatch[];
} {
  if (!ctx.hasJavaScriptFiles) {
    return { primary: null, secondary: [] };
  }

  const ranked = PRIMARY_DETECTORS.map((d) => {
    const { score, signals } = d.detect(ctx);
    return { detector: d, score, signals };
  })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    const hasPackageJson = ctx.relativePaths.some((p) =>
      p.toLowerCase().endsWith('package.json')
    );
    if (!hasPackageJson) {
      return { primary: null, secondary: [] };
    }
    return {
      primary: {
        id: 'node',
        name: 'Node.js (general)',
        language: 'javascript',
        confidence: 'low',
        score: 10,
        signals: ['package.json present; no major JS/TS framework confidently detected'],
      },
      secondary: [],
    };
  }

  let top = ranked[0];

  // Next/Nuxt include React — prefer meta-framework when competitive
  if (top.detector.id === 'react') {
    for (const metaId of PREFER_OVER_REACT) {
      const meta = ranked.find((r) => r.detector.id === metaId);
      if (meta && meta.score >= top.score - 15) {
        top = meta;
        break;
      }
    }
  }

  const primary = toMatch(top.detector, top.score, top.signals);

  const secondary = ranked
    .filter((r) => r.detector.id !== primary.id && r.score >= top.score - 12)
    .slice(0, 3)
    .map((r) => toMatch(r.detector, r.score, r.signals));

  return { primary, secondary };
}

export function isJavaScriptFrameworkId(id: string): id is JavaScriptFrameworkId {
  return (
    id === 'nextjs' ||
    id === 'react' ||
    id === 'vue' ||
    id === 'nuxt' ||
    id === 'angular' ||
    id === 'express' ||
    id === 'nestjs' ||
    id === 'svelte' ||
    id === 'node'
  );
}
