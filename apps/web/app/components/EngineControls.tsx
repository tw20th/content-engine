// apps/web/app/components/EngineControls.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ENGINE_PRESETS, getPresetById } from '../../lib/presets';

type Props = {
  strategies: string[];
  channels: string[];
  sources: string[];
};

export const EngineControls = ({ strategies, channels, sources }: Props) => {
  const router = useRouter();
  const params = useSearchParams();

  const presetParam = params.get('preset') ?? undefined;
  const preset = getPresetById(presetParam);

  const strategy = params.get('strategy') ?? preset?.strategyId ?? strategies[0] ?? 'quiet-spread';
  const channel = params.get('channel') ?? preset?.channelId ?? channels[0] ?? 'discover';
  const source = params.get('source') ?? preset?.sourceId ?? sources[0] ?? 'keywords';

  const update = (next: { strategy?: string; channel?: string; source?: string }) => {
    const nextStrategy = next.strategy ?? strategy;
    const nextChannel = next.channel ?? channel;
    const nextSource = next.source ?? source;

    const q = new URLSearchParams(params.toString());
    q.set('strategy', nextStrategy);
    q.set('channel', nextChannel);
    q.set('source', nextSource);

    // ✅ 手で触ったら preset は外す（迷い防止：いまはカスタム）
    q.delete('preset');

    router.push(`/?${q.toString()}`);
  };

  const applyPreset = (presetId: string) => {
    const p = getPresetById(presetId);
    const q = new URLSearchParams(params.toString());

    if (!p) {
      // "custom" 的な選択
      q.delete('preset');
      router.push(`/?${q.toString()}`);
      return;
    }

    q.set('preset', p.presetId);
    q.set('strategy', p.strategyId);
    q.set('channel', p.channelId);
    q.set('source', p.sourceId);

    router.push(`/?${q.toString()}`);
  };

  return (
    <div
      style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}
    >
      {/* preset */}
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ opacity: 0.7 }}>preset</span>
        <select
          value={presetParam ?? ''}
          onChange={(e) => applyPreset(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="">custom</option>
          {ENGINE_PRESETS.map((p) => (
            <option key={p.presetId} value={p.presetId}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {/* strategy */}
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ opacity: 0.7 }}>strategy</span>
        <select value={strategy} onChange={(e) => update({ strategy: e.target.value })}>
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* channel */}
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ opacity: 0.7 }}>channel</span>
        <select value={channel} onChange={(e) => update({ channel: e.target.value })}>
          {channels.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* source */}
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ opacity: 0.7 }}>source</span>
        <select value={source} onChange={(e) => update({ source: e.target.value })}>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* preset説明（ある時だけ） */}
      {preset?.description && <span style={{ opacity: 0.6 }}>{preset.description}</span>}
    </div>
  );
};
