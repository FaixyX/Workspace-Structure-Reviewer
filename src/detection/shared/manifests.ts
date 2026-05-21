import { normalizePath } from './utils';

const MANIFEST_PATTERNS: RegExp[] = [
  /^package\.json$/,
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^bun\.lockb$/,
  /^requirements.*\.txt$/,
  /^pyproject\.toml$/,
  /^pipfile$/,
  /^setup\.py$/,
  /^setup\.cfg$/,
  /\/requirements\//,
];

export function isManifestPath(relPath: string): boolean {
  const norm = normalizePath(relPath);
  const base = norm.split('/').pop() ?? norm;
  return MANIFEST_PATTERNS.some((p) => p.test(base) || p.test(norm));
}

export function collectManifestText(
  paths: string[],
  fileContents: Map<string, string>
): string {
  const chunks: string[] = [];
  for (const p of paths) {
    if (!isManifestPath(p)) continue;
    const text = fileContents.get(p);
    if (text) chunks.push(`--- ${p} ---\n${text}`);
  }
  return chunks.join('\n');
}
