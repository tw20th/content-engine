// packages/content-engine/src/registry/resolve.ts
import type { StrategyId, SourceId, ChannelId } from '../types';
import { listStrategies } from './strategies';
import { listSources } from './sources';
import { listChannels } from './channels';
import { getPresetById } from './presets';

export type ResolveEngineInput = {
  presetId?: string;
  strategyId?: string;
  sourceId?: string;
  channelId?: string;
};

export type ResolvedEngineConfig = {
  presetId?: string;
  strategyId: StrategyId;
  sourceId: SourceId;
  channelId: ChannelId;
  // どこで落ちたか追える（静かにデバッグできる）
  warnings: string[];
};

const pickValid = <T extends string>(value: string | undefined, candidates: T[]): T | null => {
  if (!value) return null;
  return candidates.includes(value as T) ? (value as T) : null;
};

export const resolveEngineConfig = (input: ResolveEngineInput): ResolvedEngineConfig => {
  const warnings: string[] = [];

  const strategies = listStrategies();
  const sources = listSources();
  const channels = listChannels();

  const preset = getPresetById(input.presetId);

  // ✅ 優先順位：明示指定 > preset > 先頭（=default）
  const rawStrategy = input.strategyId ?? preset?.strategyId;
  const rawSource = input.sourceId ?? preset?.sourceId;
  const rawChannel = input.channelId ?? preset?.channelId;

  const strategyId =
    pickValid<StrategyId>(rawStrategy, strategies) ??
    (strategies[0] as StrategyId | undefined) ??
    ('quiet-spread' as StrategyId);

  const sourceId =
    pickValid<SourceId>(rawSource, sources) ??
    (sources[0] as SourceId | undefined) ??
    ('keywords' as SourceId);

  const channelId =
    pickValid<ChannelId>(rawChannel, channels) ??
    (channels[0] as ChannelId | undefined) ??
    ('discover' as ChannelId);

  if (rawStrategy && rawStrategy !== strategyId)
    warnings.push(`Unknown strategyId: ${rawStrategy}`);
  if (rawSource && rawSource !== sourceId) warnings.push(`Unknown sourceId: ${rawSource}`);
  if (rawChannel && rawChannel !== channelId) warnings.push(`Unknown channelId: ${rawChannel}`);
  if (input.presetId && !preset) warnings.push(`Unknown presetId: ${input.presetId}`);

  return {
    presetId: preset?.presetId,
    strategyId,
    sourceId,
    channelId,
    warnings,
  };
};
