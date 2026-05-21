import { JavaScriptDetector } from '../types';
import { depsMention, sampleMention } from '../../shared/utils';

export const nestjsDetector: JavaScriptDetector = {
  id: 'nestjs',
  name: 'NestJS',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"@nestjs\/core"\s*:/)) {
      score += 45;
      signals.push('@nestjs/core in package.json');
    }
    if (sampleMention(ctx.javascriptSampleText, /@Module\s*\(|@Controller\s*\(|@Injectable\s*\(/)) {
      score += 35;
      signals.push('Nest decorators (@Module, @Controller)');
    }
    if (sampleMention(ctx.javascriptSampleText, /NestFactory\.create/)) {
      score += 20;
      signals.push('NestFactory.create bootstrap');
    }

    return { score, signals };
  },
};
