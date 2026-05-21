const DEPENDENCY_FILES = new Set([
  'requirements.txt',
  'requirements-dev.txt',
  'requirements/base.txt',
  'requirements/local.txt',
  'pyproject.toml',
  'pipfile',
  'setup.py',
  'setup.cfg',
]);

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

export function pathsInclude(paths: string[], pattern: RegExp): boolean {
  return paths.some((p) => pattern.test(normalizePath(p)));
}

export function collectDependencyText(paths: string[], fileContents: Map<string, string>): string {
  const chunks: string[] = [];
  for (const p of paths) {
    const norm = normalizePath(p);
    const base = norm.split('/').pop() ?? norm;
    if (DEPENDENCY_FILES.has(base) || norm.endsWith('/pyproject.toml')) {
      const text = fileContents.get(p);
      if (text) chunks.push(text);
    }
  }
  return chunks.join('\n');
}

export function depsMention(deps: string, pattern: RegExp): boolean {
  return pattern.test(deps.toLowerCase());
}

export function sampleMention(samples: string, pattern: RegExp): boolean {
  return pattern.test(samples);
}
