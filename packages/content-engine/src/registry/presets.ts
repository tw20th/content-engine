// packages/content-engine/src/registry/presets.ts
import type { StrategyId, SourceId, ChannelId } from '../types';

export type EnginePresetId = string;

export type EnginePreset = {
  presetId: EnginePresetId;
  label: string;
  description?: string;
  strategyId: StrategyId;
  sourceId: SourceId;
  channelId: ChannelId;
};

export const ENGINE_PRESETS: EnginePreset[] = [
  {
    presetId: 'default',
    label: 'default',
    description: '迷ったらこれ（静かな広がり）',
    strategyId: 'quiet-spread',
    sourceId: 'keywords',
    channelId: 'discover',
  },
  {
    presetId: 'gentle-rewrite',
    label: 'gentle-rewrite',
    description: '整える（静かなリライト）',
    strategyId: 'quiet-rewrite',
    sourceId: 'rewrite',
    channelId: 'discover',
  },
  {
    presetId: 'seo-push',
    label: 'seo-push',
    description: 'SEO寄り（seo channelで整える）',
    strategyId: 'seo-basic',
    sourceId: 'keywords',
    channelId: 'seo',
  },
  {
    presetId: 'openai-default',
    label: 'openai-default',
    description: 'ChatGPTで生成（topic/title/content）',
    strategyId: 'openai-basic',
    sourceId: 'keywords',
    channelId: 'discover',
  },
];

export const getPresetById = (presetId: string | null | undefined): EnginePreset | null => {
  if (!presetId) return null;
  return ENGINE_PRESETS.find((p) => p.presetId === presetId) ?? null;
};
