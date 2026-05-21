import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const nuxtDetector: JavaScriptDetector = {
  id: 'nuxt',
  name: 'Nuxt',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"nuxt"\s*:/)) {
      score += 45;
      signals.push('nuxt in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)nuxt\.config\.(ts|js|mjs)$/)) {
      score += 35;
      signals.push('nuxt.config');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)pages\/.*\.vue$/)) {
      score += 15;
      signals.push('pages/ with .vue');
    }
    if (sampleMention(ctx.javascriptSampleText, /from\s+['"]#app|from\s+['"]nuxt\//)) {
      score += 15;
      signals.push('Nuxt auto-imports / #app');
    }

    return { score, signals };
  },
};
