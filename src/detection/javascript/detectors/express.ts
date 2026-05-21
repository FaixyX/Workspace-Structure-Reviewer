import { JavaScriptDetector } from '../types';
import { depsMention, sampleMention } from '../../shared/utils';

export const expressDetector: JavaScriptDetector = {
  id: 'express',
  name: 'Express',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"express"\s*:/)) {
      score += 40;
      signals.push('express in package.json');
    }
    if (sampleMention(ctx.javascriptSampleText, /from\s+['"]express['"]|require\s*\(\s*['"]express['"]\)/)) {
      score += 30;
      signals.push('Express import');
    }
    if (sampleMention(ctx.javascriptSampleText, /express\s*\(\s*\)|app\.(get|post|put|delete|use)\s*\(/)) {
      score += 25;
      signals.push('express() or app.METHOD routes');
    }

    return { score, signals };
  },
};
