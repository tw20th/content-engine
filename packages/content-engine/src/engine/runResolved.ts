// packages/content-engine/src/engine/runResolved.ts
import type { GeneratedArticle } from '../types';
import type { RunInput, RunOptions } from './run';
import { runContentEngine } from './run';
import type { ResolveEngineInput, ResolvedEngineConfig } from '../registry/resolve';
import { resolveEngineConfig } from '../registry/resolve';

export type RunResolvedInputUnresolved = ResolveEngineInput & {
  topic?: string;
  draft?: string;
};

export type RunResolvedInputResolved = {
  config: ResolvedEngineConfig;
  topic?: string;
  draft?: string;
};

export type RunResolvedInput = RunResolvedInputUnresolved | RunResolvedInputResolved;

export type RunResolvedResult = {
  config: ResolvedEngineConfig;
  article: GeneratedArticle;
};

const hasResolvedConfig = (input: RunResolvedInput): input is RunResolvedInputResolved => {
  return 'config' in input;
};

export const runResolvedContentEngine = async (
  input: RunResolvedInput,
): Promise<RunResolvedResult> => {
  const config = hasResolvedConfig(input)
    ? input.config
    : resolveEngineConfig({
        presetId: input.presetId,
        strategyId: input.strategyId,
        sourceId: input.sourceId,
        channelId: input.channelId,
      });

  const runInput: RunInput = {
    sourceId: config.sourceId,
    channelId: config.channelId,
    topic: input.topic,
    draft: input.draft,
  };

  const opts: RunOptions = { strategyId: config.strategyId };

  const article = await runContentEngine(runInput, opts);

  return { config, article };
};
