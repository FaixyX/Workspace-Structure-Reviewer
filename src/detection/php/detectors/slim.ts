import { PhpDetector } from '../types';
import { depsMention, sampleMention } from '../../shared/utils';

export const slimDetector: PhpDetector = {
  id: 'slim',
  name: 'Slim',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"slim\/slim"|"slim\/psr7"/)) {
      score += 40;
      signals.push('slim/slim in composer.json');
    }
    if (sampleMention(ctx.phpSampleText, /Slim\\App|AppFactory::create|->get\s*\(|->post\s*\(/)) {
      score += 30;
      signals.push('Slim App and route methods');
    }
    if (sampleMention(ctx.phpSampleText, /use Psr\\Http\\Message/)) {
      score += 10;
      signals.push('PSR-7 HTTP message usage');
    }

    return { score, signals };
  },
};
