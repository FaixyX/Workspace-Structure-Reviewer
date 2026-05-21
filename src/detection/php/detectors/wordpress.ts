import { PhpDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const wordpressDetector: PhpDetector = {
  id: 'wordpress',
  name: 'WordPress',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (pathsInclude(ctx.relativePaths, /(^|\/)wp-config\.php$/)) {
      score += 45;
      signals.push('wp-config.php');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)wp-content\/(themes|plugins)\//)) {
      score += 30;
      signals.push('wp-content/themes or plugins');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)wp-includes\//)) {
      score += 25;
      signals.push('wp-includes/');
    }
    if (depsMention(ctx.manifestText, /"johnpbloch\/wordpress"|"roots\/wordpress"/)) {
      score += 20;
      signals.push('WordPress in composer (Bedrock-style)');
    }
    if (sampleMention(ctx.phpSampleText, /ABSPATH|wp_enqueue_|add_action\s*\(|get_template_part/)) {
      score += 25;
      signals.push('WordPress hooks / template APIs');
    }

    return { score, signals };
  },
};
