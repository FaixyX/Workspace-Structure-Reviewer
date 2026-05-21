import { StackDetectionResult } from '../detection/types';

export interface WorkspaceScanResult {
  contextText: string;
  relativePaths: string[];
  manifestText: string;
  pythonSampleText: string;
  javascriptSampleText: string;
  phpSampleText: string;
  hasPythonFiles: boolean;
  hasJavaScriptFiles: boolean;
  hasPhpFiles: boolean;
  stack: StackDetectionResult;
}
