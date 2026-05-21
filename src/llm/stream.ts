import { mergeUsage } from '../usage/estimate';
import { getModelId } from '../usage/pricing';
import { streamClaude } from './providers/claude';
import { streamGemini } from './providers/gemini';
import { streamOpenAI } from './providers/openai';
import { streamOpenAICompatible } from './providers/openaiCompatible';
import { ProviderConnection, StreamReviewResult, ChunkHandler } from './types';
import { UsageAccumulator } from './usageAccumulator';

export type { ChunkHandler, StreamReviewResult } from './types';

export async function streamReview(
  connection: ProviderConnection,
  systemPrompt: string,
  userPrompt: string,
  onChunk: ChunkHandler
): Promise<StreamReviewResult> {
  const { provider, apiKey, baseUrl, model } = connection;
  const inputText = systemPrompt + userPrompt;
  let outputText = '';
  const onChunkWithCapture: ChunkHandler = (text) => {
    outputText += text;
    onChunk(text);
  };

  let acc: UsageAccumulator;

  switch (provider) {
    case 'claude':
      acc = await streamClaude(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
    case 'openai':
      acc = await streamOpenAI(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
    case 'gemini':
      acc = await streamGemini(apiKey, systemPrompt, userPrompt, onChunkWithCapture);
      break;
    case 'custom':
      acc = await streamOpenAICompatible(
        baseUrl ?? 'http://localhost:11434/v1',
        model ?? 'llama3.2',
        apiKey,
        systemPrompt,
        userPrompt,
        onChunkWithCapture
      );
      break;
  }

  const usage = mergeUsage(
    acc.inputTokens !== undefined || acc.outputTokens !== undefined
      ? {
          inputTokens: acc.inputTokens,
          outputTokens: acc.outputTokens,
          totalTokens: (acc.inputTokens ?? 0) + (acc.outputTokens ?? 0),
          source: 'api' as const,
        }
      : null,
    inputText,
    outputText
  );

  const modelId =
    provider === 'custom' ? (model ?? 'custom-local') : getModelId(provider);

  return { provider, model: modelId, usage };
}
