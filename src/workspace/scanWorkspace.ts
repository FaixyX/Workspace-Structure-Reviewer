import * as path from 'path';
import * as vscode from 'vscode';
import { isManifestPath, collectManifestText } from '../detection/shared/manifests';
import { detectStack } from '../detection/detectStack';
import {
  JAVASCRIPT_EXTENSIONS,
  PHP_EXTENSIONS,
  MAX_CHARS_PER_FILE,
  MAX_JAVASCRIPT_SAMPLES,
  MAX_PHP_SAMPLES,
  MAX_PYTHON_SAMPLES,
  MAX_SOURCE_FILES,
  SOURCE_EXTENSIONS,
  WORKSPACE_EXCLUDE_GLOB,
} from './constants';
import { WorkspaceScanResult } from './types';

export async function scanWorkspace(): Promise<WorkspaceScanResult> {
  const root = vscode.workspace.workspaceFolders![0].uri.fsPath;

  const allFiles = await vscode.workspace.findFiles('**/*', WORKSPACE_EXCLUDE_GLOB);

  const relativePaths = allFiles
    .map((f) => path.relative(root, f.fsPath).replace(/\\/g, '/'))
    .sort();

  const fileContents = new Map<string, string>();
  const pythonPaths: string[] = [];
  const javascriptPaths: string[] = [];
  const phpPaths: string[] = [];
  const sourcePaths: string[] = [];

  for (const file of allFiles) {
    const rel = path.relative(root, file.fsPath).replace(/\\/g, '/');
    const ext = path.extname(file.fsPath).toLowerCase();
    if (ext === '.py') pythonPaths.push(rel);
    if (JAVASCRIPT_EXTENSIONS.has(ext)) javascriptPaths.push(rel);
    if (PHP_EXTENSIONS.has(ext)) phpPaths.push(rel);
    if (SOURCE_EXTENSIONS.has(ext)) sourcePaths.push(rel);
  }

  const pathsToRead = new Set<string>();
  for (const rel of relativePaths) {
    if (isManifestPath(rel)) pathsToRead.add(rel);
  }

  const sampleForReview = sourcePaths.slice(0, MAX_SOURCE_FILES);
  const pythonForDetection = pythonPaths.slice(0, MAX_PYTHON_SAMPLES);
  const jsForDetection = javascriptPaths.slice(0, MAX_JAVASCRIPT_SAMPLES);
  const phpForDetection = phpPaths.slice(0, MAX_PHP_SAMPLES);

  for (const p of [...sampleForReview, ...pythonForDetection, ...jsForDetection, ...phpForDetection]) {
    pathsToRead.add(p);
  }

  let fileContentsBlock = '';
  let pythonSampleText = '';
  let javascriptSampleText = '';
  let phpSampleText = '';

  for (const rel of pathsToRead) {
    const uri = vscode.Uri.file(path.join(root, rel));
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const text = doc.getText();
      const slice = text.slice(0, MAX_CHARS_PER_FILE);
      fileContents.set(rel, text);

      if (rel.endsWith('.py')) {
        pythonSampleText += `\n\n=== ${rel} ===\n${slice}`;
      }
      if (JAVASCRIPT_EXTENSIONS.has(path.extname(rel).toLowerCase())) {
        javascriptSampleText += `\n\n=== ${rel} ===\n${slice}`;
      }
      if (PHP_EXTENSIONS.has(path.extname(rel).toLowerCase())) {
        phpSampleText += `\n\n=== ${rel} ===\n${slice}`;
      }
      if (sampleForReview.includes(rel)) {
        fileContentsBlock += `\n\n=== ${rel} ===\n${slice}`;
      }
    } catch {
      // skip unreadable
    }
  }

  const manifestText = collectManifestText(relativePaths, fileContents);
  const hasPythonFiles = pythonPaths.length > 0;
  const hasJavaScriptFiles = javascriptPaths.length > 0;
  const hasPhpFiles = phpPaths.length > 0;

  const stack = detectStack({
    relativePaths,
    manifestText,
    pythonSampleText,
    javascriptSampleText,
    phpSampleText,
    hasPythonFiles,
    hasJavaScriptFiles,
    hasPhpFiles,
  });

  const stackBlock = formatStackBlock(stack);

  const contextText = [
    stackBlock,
    `PROJECT FILE TREE:\n${relativePaths.join('\n')}`,
    `SOURCE FILE SAMPLES:${fileContentsBlock}`,
  ].join('\n\n');

  return {
    contextText,
    relativePaths,
    manifestText,
    pythonSampleText,
    javascriptSampleText,
    phpSampleText,
    hasPythonFiles,
    hasJavaScriptFiles,
    hasPhpFiles,
    stack,
  };
}

function formatStackBlock(stack: WorkspaceScanResult['stack']): string {
  if (!stack.primary) {
    return `DETECTED STACK:\n${stack.summary}`;
  }

  const lines = [
    'DETECTED STACK:',
    `- Ecosystem: ${stack.language}`,
    `- Framework: ${stack.primary.name} (${stack.primary.id}, ${stack.primary.confidence} confidence)`,
    `- Detection signals: ${stack.primary.signals.join('; ')}`,
  ];

  if (stack.secondary.length > 0) {
    lines.push(
      `- Related: ${stack.secondary.map((s) => `${s.name} (${s.confidence})`).join(', ')}`
    );
  }

  return lines.join('\n');
}
