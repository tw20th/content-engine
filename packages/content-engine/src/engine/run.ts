//packages/content-engine/src/engine/run.ts
import type {
  GeneratedArticle,
  Strategy,
  StrategyId,
  SourceId,
  ChannelId,
  GenerateInput,
} from '../types';
import { getStrategy } from '../registry/strategies';
import { getSource } from '../registry/sources';
import { getChannel } from '../registry/channels';

export type RunInput = {
  sourceId: SourceId;
  channelId: ChannelId;
  topic?: string;
  draft?: string;
};

export type RunOptions = { strategy: Strategy } | { strategyId: StrategyId };

export const runContentEngine = async (
  input: RunInput,
  opts: RunOptions,
): Promise<GeneratedArticle> => {
  const strategy = 'strategy' in opts ? opts.strategy : getStrategy(opts.strategyId);
  const source = getSource(input.sourceId);
  const channel = getChannel(input.channelId);

  const nowIso = new Date().toISOString();

  const payload = input.topic
    ? { topic: input.topic }
    : source.prepare({ strategyId: strategy.strategyId, channelId: input.channelId, nowIso });

  const generateInput: GenerateInput = {
    topic: payload.topic,
    sourceId: input.sourceId,
    channelId: input.channelId,
    draft: input.draft ?? payload.draft,
    product: payload.product,
  };

  const raw = await strategy.generate(generateInput);
  const optimized = channel.optimize(raw);
  return optimized;
};
