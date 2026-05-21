import { ChunkHandler } from '../types';
import { UsageAccumulator } from '../usageAccumulator';
import { streamOpenAICompatible } from './openaiCompatible';

export function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<UsageAccumulator> {
  return streamOpenAICompatible(
    'https://api.openai.com/v1',
    'gpt-4o-mini',
    apiKey,
    systemPrompt,
    userPrompt,
    onChunk
  );
}
