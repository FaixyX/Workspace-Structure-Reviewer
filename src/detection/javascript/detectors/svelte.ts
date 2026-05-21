import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const svelteDetector: JavaScriptDetector = {
  id: 'svelte',
  name: 'Svelte',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"svelte"\s*:/)) {
      score += 40;
      signals.push('svelte in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /\.svelte$/)) {
      score += 35;
      signals.push('.svelte components');
    }
    if (depsMention(ctx.manifestText, /"@sveltejs\/kit"\s*:/)) {
      score += 25;
      signals.push('SvelteKit (@sveltejs/kit)');
    }
    if (sampleMention(ctx.javascriptSampleText, /<script[^>]*>|export\s+let\s+/)) {
      score += 10;
      signals.push('Svelte component patterns');
    }

    return { score, signals };
  },
};
