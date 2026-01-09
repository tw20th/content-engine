// apps/web/lib/presets.ts
export type EnginePreset = {
  presetId: string;
  label: string;
  description?: string;
  strategyId: string;
  sourceId: string;
  channelId: string;
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
];

export const getPresetById = (presetId: string | null | undefined): EnginePreset | null => {
  if (!presetId) return null;
  return ENGINE_PRESETS.find((p) => p.presetId === presetId) ?? null;
};
