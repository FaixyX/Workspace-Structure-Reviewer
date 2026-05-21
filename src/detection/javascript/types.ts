export type JavaScriptFrameworkId =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'angular'
  | 'express'
  | 'nestjs'
  | 'svelte'
  | 'node';

export interface JavaScriptWorkspaceContext {
  relativePaths: string[];
  manifestText: string;
  javascriptSampleText: string;
  hasJavaScriptFiles: boolean;
}

export interface JavaScriptDetector {
  id: JavaScriptFrameworkId;
  name: string;
  detect(ctx: JavaScriptWorkspaceContext): { score: number; signals: string[] };
}
