import { StackDetectionResult } from '../detection/types';

export interface WorkspaceScanResult {
  contextText: string;
  relativePaths: string[];
  manifestText: string;
  pythonSampleText: string;
  javascriptSampleText: string;
  hasPythonFiles: boolean;
  hasJavaScriptFiles: boolean;
  stack: StackDetectionResult;
}
