import { JavaScriptDetector } from '../types';
import { depsMention, pathsInclude, sampleMention } from '../../shared/utils';

export const reactDetector: JavaScriptDetector = {
  id: 'react',
  name: 'React',
  detect(ctx) {
    let score = 0;
    const signals: string[] = [];

    if (depsMention(ctx.manifestText, /"react"\s*:|"react-dom"\s*:/)) {
      score += 35;
      signals.push('react / react-dom in package.json');
    }
    if (pathsInclude(ctx.relativePaths, /\.(tsx|jsx)$/)) {
      score += 15;
      signals.push('.tsx / .jsx components');
    }
    if (sampleMention(ctx.javascriptSampleText, /from\s+['"]react['"]|import\s+React\b/)) {
      score += 25;
      signals.push('React imports');
    }
    if (sampleMention(ctx.javascriptSampleText, /createRoot\s*\(|ReactDOM\.render/)) {
      score += 15;
      signals.push('React 18 createRoot or legacy render');
    }
    if (pathsInclude(ctx.relativePaths, /(^|\/)src\/(app|components)\//)) {
      score += 10;
      signals.push('src/components or src/app layout');
    }
    if (depsMention(ctx.manifestText, /"vite"\s*:/)) {
      score += 5;
      signals.push('Vite (common React toolchain)');
    }

    return { score, signals };
  },
};
