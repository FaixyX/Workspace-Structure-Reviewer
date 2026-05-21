import { PhpDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const codeigniterDetector: PhpDetector = {
  id: 'codeigniter',
  name: 'CodeIgniter',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"codeigniter4\/framework"|"codeigniter\/framework"/)) {
      score += 45;
      signals.push('codeigniter in composer.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)app\/controllers\//)) {
      score += 25;
      signals.push('app/Controllers');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)writable\//)) {
      score += 15;
      signals.push('writable/ directory');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)system\//)) {
      score += 10;
      signals.push('system/ core folder');
    }
    if (sampleMention(ctx.phpSampleText, /CodeIgniter\\|extends BaseController|public function initController/)) {
      score += 25;
      signals.push('CodeIgniter controller patterns');
    }

    return { score, signals };
  },
};
