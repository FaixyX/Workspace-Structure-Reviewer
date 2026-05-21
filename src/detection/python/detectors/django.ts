import { PythonDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../utils';

export const djangoDetector: PythonDetector = {
  id: 'django',
  name: 'Django',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (pathsInclude(ctx.relativePaths, /(^|\/)manage\.py$/)) {
      score += 40;
      signals.push('Found manage.py');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)settings\.py$/)) {
      score += 15;
      signals.push('Found settings.py');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)urls\.py$/)) {
      score += 10;
      signals.push('Found urls.py');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)(wsgi|asgi)\.py$/)) {
      score += 10;
      signals.push('Found WSGI/ASGI entry');
    }
    if (depsMention(ctx.dependencyText, /\bdjango\b/)) {
      score += 35;
      signals.push('django listed in dependencies');
    }
    if (depsMention(ctx.dependencyText, /\bdjangorestframework\b|\bdrf\b/)) {
      score += 10;
      signals.push('Django REST framework in dependencies');
    }
    if (sampleMention(ctx.pythonSampleText, /\bfrom django\b|\bimport django\b/)) {
      score += 25;
      signals.push('Django imports in Python sources');
    }
    if (sampleMention(ctx.pythonSampleText, /INSTALLED_APPS/)) {
      score += 15;
      signals.push('INSTALLED_APPS in settings');
    }

    return { score, signals };
  },
};
