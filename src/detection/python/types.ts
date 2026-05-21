export type PythonFrameworkId =
  | 'django'
  | 'fastapi'
  | 'flask'
  | 'starlette'
  | 'celery'
  | 'python';

export interface PythonWorkspaceContext {
  relativePaths: string[];
  dependencyText: string;
  pythonSampleText: string;
  hasPythonFiles: boolean;
}

export interface PythonDetector {
  id: PythonFrameworkId;
  name: string;
  detect(ctx: PythonWorkspaceContext): { score: number; signals: string[] };
}
