import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const vueDetector: JavaScriptDetector = {
  id: 'vue',
  name: 'Vue',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"vue"\s*:/)) {
      score += 40;
      signals.push('vue in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /\.vue$/)) {
      score += 30;
      signals.push('.vue single-file components');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)vite\.config\.(ts|js)$/)) {
      score += 5;
    }
    if (sampleMention(ctx.javascriptSampleText, /from\s+['"]vue['"]|defineComponent\s*\(/)) {
      score += 25;
      signals.push('Vue imports / defineComponent');
    }
    if (sampleMention(ctx.javascriptSampleText, /createApp\s*\(/)) {
      score += 15;
      signals.push('createApp()');
    }

    return { score, signals };
  },
};
