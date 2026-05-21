export type PhpFrameworkId =
  | 'laravel'
  | 'symfony'
  | 'codeigniter'
  | 'wordpress'
  | 'drupal'
  | 'slim'
  | 'php';

export interface PhpWorkspaceContext {
  relativePaths: string[];
  manifestText: string;
  phpSampleText: string;
  hasPhpFiles: boolean;
}

export interface PhpDetector {
  id: PhpFrameworkId;
  name: string;
  detect(ctx: PhpWorkspaceContext): { score: number; signals: string[] };
}
