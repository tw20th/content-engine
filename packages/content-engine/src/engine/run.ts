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
  draft?: string; // ✅ 追加
};

export type RunOptions = { strategy: Strategy } | { strategyId: StrategyId };

export const runContentEngine = (input: RunInput, opts: RunOptions): GeneratedArticle => {
  const strategy = 'strategy' in opts ? opts.strategy : getStrategy(opts.strategyId);
  const source = getSource(input.sourceId);
  const channel = getChannel(input.channelId);

  const nowIso = new Date().toISOString();

  // ✅ topic が無ければ Source が供給
  const payload = input.topic
    ? { topic: input.topic }
    : source.prepare({ strategyId: strategy.strategyId, channelId: input.channelId, nowIso });

  const generateInput: GenerateInput = {
    topic: payload.topic,
    sourceId: input.sourceId,
    channelId: input.channelId,
    draft: input.draft ?? payload.draft, // ✅ ここ
    product: payload.product,
  };

  const raw = strategy.generate(generateInput);
  const optimized = channel.optimize(raw);
  return optimized;
};
