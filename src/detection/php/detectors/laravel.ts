import { PhpDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const laravelDetector: PhpDetector = {
  id: 'laravel',
  name: 'Laravel',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (pathsInclude(ctx.relativePaths, /(^|\/)artisan$/)) {
      score += 40;
      signals.push('artisan CLI');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)routes\/(web|api)\.php$/)) {
      score += 20;
      signals.push('routes/web.php or routes/api.php');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)app\/http\/controllers\//)) {
      score += 20;
      signals.push('app/Http/Controllers');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)bootstrap\/app\.php$/)) {
      score += 15;
      signals.push('bootstrap/app.php (Laravel 11+)');
    }
    if (depsMention(ctx.manifestText, /"laravel\/framework"|"laravel\/laravel"/)) {
      score += 40;
      signals.push('laravel/framework in composer.json');
    }
    if (sampleMention(ctx.phpSampleText, /Illuminate\\|namespace App\\|use App\\/)) {
      score += 25;
      signals.push('Illuminate / App namespace in PHP');
    }
    if (sampleMention(ctx.phpSampleText, /Route::(get|post|put|delete|resource)/)) {
      score += 15;
      signals.push('Route facade usage');
    }

    return { score, signals };
  },
};
