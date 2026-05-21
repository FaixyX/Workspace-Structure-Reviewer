import { StackDetectionResult } from '../detection/types';

export interface WorkspaceScanResult {
  contextText: string;
  relativePaths: string[];
  dependencyText: string;
  pythonSampleText: string;
  hasPythonFiles: boolean;
  stack: StackDetectionResult;
}
