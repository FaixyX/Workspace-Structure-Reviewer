import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const angularDetector: JavaScriptDetector = {
  id: 'angular',
  name: 'Angular',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"@angular\/core"\s*:/)) {
      score += 45;
      signals.push('@angular/core in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)angular\.json$/)) {
      score += 35;
      signals.push('angular.json');
    }
    if (sampleMention(ctx.javascriptSampleText, /@Component\s*\(|@NgModule\s*\(/)) {
      score += 30;
      signals.push('@Component / @NgModule decorators');
    }
    if (pathsInclude(ctx.relativePaths, /\.component\.ts$/)) {
      score += 20;
      signals.push('*.component.ts files');
    }

    return { score, signals };
  },
};
