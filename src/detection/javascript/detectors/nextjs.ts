import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const nextjsDetector: JavaScriptDetector = {
  id: 'nextjs',
  name: 'Next.js',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"next"\s*:|'next'|"next":/)) {
      score += 45;
      signals.push('next in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)next\.config\.(js|mjs|ts)$/)) {
      score += 35;
      signals.push('next.config file');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)app\/(layout|page)\.(tsx|jsx|js|ts)$/)) {
      score += 25;
      signals.push('App Router (app/ directory)');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)pages\/.*\.(tsx|jsx|js)$/)) {
      score += 20;
      signals.push('Pages Router (pages/)');
    }
    if (sampleMention(ctx.javascriptSampleText, /from\s+['"]next\//)) {
      score += 15;
      signals.push('next/* imports');
    }

    return { score, signals };
  },
};
