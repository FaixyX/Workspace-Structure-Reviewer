import { PythonDetector } from '../types';
import { depsMention, sampleMention } from '../utils';

/** Secondary stack signal — often paired with Django/Flask */
export const celeryDetector: PythonDetector = {
  id: 'celery',
  name: 'Celery',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.dependencyText, /\bcelery\b/)) {
      score += 35;
      signals.push('celery listed in dependencies');
    }
    if (sampleMention(ctx.pythonSampleText, /\bfrom celery\b|\bimport celery\b/)) {
      score += 25;
      signals.push('Celery imports in Python sources');
    }
    if (sampleMention(ctx.pythonSampleText, /@shared_task|@app\.task/)) {
      score += 15;
      signals.push('Celery task decorators');
    }

    return { score, signals };
  },
};
