import { PhpDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const symfonyDetector: PhpDetector = {
  id: 'symfony',
  name: 'Symfony',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"symfony\/framework-bundle"|"symfony\/symfony"/)) {
      score += 40;
      signals.push('symfony packages in composer.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)config\/(packages|bundles\.php|routes)/)) {
      score += 25;
      signals.push('config/packages or bundles.php');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)src\/(controller|entity|repository)\//)) {
      score += 15;
      signals.push('src/Controller or Entity structure');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)public\/index\.php$/)) {
      score += 10;
      signals.push('public/index.php front controller');
    }
    if (sampleMention(ctx.phpSampleText, /Symfony\\|AbstractController|#\[Route/)) {
      score += 25;
      signals.push('Symfony namespace or #[Route] attributes');
    }

    return { score, signals };
  },
};
