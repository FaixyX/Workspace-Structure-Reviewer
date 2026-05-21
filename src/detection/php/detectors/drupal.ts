import { PhpDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const drupalDetector: PhpDetector = {
  id: 'drupal',
  name: 'Drupal',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"drupal\/core"|"drupal\/recommended-project"/)) {
      score += 45;
      signals.push('drupal/core in composer.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)sites\/default\/(settings|services)\.php$/)) {
      score += 30;
      signals.push('sites/default settings');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)modules\/(custom|contrib)\//)) {
      score += 20;
      signals.push('modules/custom or contrib');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)web\/modules\//)) {
      score += 20;
      signals.push('web/modules (Composer layout)');
    }
    if (sampleMention(ctx.phpSampleText, /Drupal\\|hook_form_alter|\.module\b|@Route/)) {
      score += 20;
      signals.push('Drupal hooks / routing patterns');
    }

    return { score, signals };
  },
};
