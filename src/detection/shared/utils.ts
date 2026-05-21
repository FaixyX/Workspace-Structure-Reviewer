export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

export function pathsInclude(paths: string[], pattern: RegExp): boolean {
  return paths.some((p) => pattern.test(normalizePath(p)));
}

export function depsMention(manifestText: string, pattern: RegExp): boolean {
  return pattern.test(manifestText.toLowerCase());
}

export function sampleMention(samples: string, pattern: RegExp): boolean {
  return pattern.test(samples);
}
