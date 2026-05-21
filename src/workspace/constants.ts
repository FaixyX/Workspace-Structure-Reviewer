export const WORKSPACE_EXCLUDE_GLOB =
  '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**,**/.next/**,**/.nuxt/**,**/coverage/**,**/__pycache__/**,**/.venv/**,**/venv/**,**/.tox/**}';

export const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.go', '.java', '.cs',
  '.cpp', '.c', '.rb', '.php',
  '.vue', '.svelte', '.rs', '.kt', '.swift',
]);

export const JAVASCRIPT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
]);

export const MAX_SOURCE_FILES = 20;
export const MAX_CHARS_PER_FILE = 1500;
export const PHP_EXTENSIONS = new Set(['.php']);

export const MAX_PYTHON_SAMPLES = 12;
export const MAX_JAVASCRIPT_SAMPLES = 12;
export const MAX_PHP_SAMPLES = 12;
