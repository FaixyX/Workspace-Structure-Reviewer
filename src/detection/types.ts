export type Confidence = 'high' | 'medium' | 'low';

export interface FrameworkMatch {
  id: string;
  name: string;
  language: string;
  confidence: Confidence;
  score: number;
  signals: string[];
}

export interface StackDetectionResult {
  language: string;
  primary: FrameworkMatch | null;
  secondary: FrameworkMatch[];
  /** One-line summary for UI and prompts */
  summary: string;
}

export interface DetectorScore {
  id: string;
  name: string;
  score: number;
  signals: string[];
}
