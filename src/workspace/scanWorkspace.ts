import * as path from 'path';
import * as vscode from 'vscode';
import { collectDependencyText } from '../detection/python/utils';
import { detectStack } from '../detection/detectStack';
import {
  MAX_CHARS_PER_FILE,
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
  const sourcePaths: string[] = [];

  for (const file of allFiles) {
    const rel = path.relative(root, file.fsPath).replace(/\\/g, '/');
    const ext = path.extname(file.fsPath).toLowerCase();
    if (ext === '.py') pythonPaths.push(rel);
    if (SOURCE_EXTENSIONS.has(ext)) sourcePaths.push(rel);
  }

  const pathsToRead = new Set<string>();
  for (const rel of relativePaths) {
    const base = rel.split('/').pop() ?? rel;
    if (
      /^(requirements.*\.txt|pyproject\.toml|pipfile|setup\.py|setup\.cfg)$/i.test(base) ||
      rel.includes('requirements/')
    ) {
      pathsToRead.add(rel);
    }
  }

  const sampleForReview = sourcePaths.slice(0, MAX_SOURCE_FILES);
  const pythonForDetection = pythonPaths.slice(0, MAX_PYTHON_SAMPLES);
  for (const p of [...sampleForReview, ...pythonForDetection]) {
    pathsToRead.add(p);
  }

  let fileContentsBlock = '';
  let pythonSampleText = '';

  for (const rel of pathsToRead) {
    const uri = vscode.Uri.file(path.join(root, rel));
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const text = doc.getText();
      fileContents.set(rel, text);

      if (rel.endsWith('.py')) {
        pythonSampleText += `\n\n=== ${rel} ===\n${text.slice(0, MAX_CHARS_PER_FILE)}`;
      }

      if (sampleForReview.includes(rel)) {
        fileContentsBlock += `\n\n=== ${rel} ===\n${text.slice(0, MAX_CHARS_PER_FILE)}`;
      }
    } catch {
      // skip unreadable
    }
  }

  const dependencyText = collectDependencyText(relativePaths, fileContents);
  const hasPythonFiles = pythonPaths.length > 0;

  const stack = detectStack({
    relativePaths,
    dependencyText,
    pythonSampleText,
    hasPythonFiles,
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
    dependencyText,
    pythonSampleText,
    hasPythonFiles,
    stack,
  };
}

function formatStackBlock(stack: WorkspaceScanResult['stack']): string {
  if (!stack.primary) {
    return `DETECTED STACK:\n${stack.summary}`;
  }

  const lines = [
    'DETECTED STACK:',
    `- Language: ${stack.language}`,
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
