import { PythonDetector } from '../types';
import { depsMention, sampleMention } from '../utils';

export const flaskDetector: PythonDetector = {
  id: 'flask',
  name: 'Flask',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.dependencyText, /\bflask\b/)) {
      score += 40;
      signals.push('flask listed in dependencies');
    }
    if (sampleMention(ctx.pythonSampleText, /\bfrom flask\b|\bimport flask\b/)) {
      score += 35;
      signals.push('Flask imports in Python sources');
    }
    if (sampleMention(ctx.pythonSampleText, /Flask\s*\(__name__\)/)) {
      score += 25;
      signals.push('Flask(__name__) app pattern');
    }
    if (sampleMention(ctx.pythonSampleText, /@app\.route\s*\(/)) {
      score += 15;
      signals.push('@app.route decorators');
    }
    if (sampleMention(ctx.pythonSampleText, /Blueprint\s*\(/)) {
      score += 10;
      signals.push('Flask Blueprint usage');
    }

    return { score, signals };
  },
};
