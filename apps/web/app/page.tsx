// apps/web/app/page.tsx
import { resolveEngineConfig, runResolvedContentEngine } from '@content-engine/core';
import { EngineControls } from './components/EngineControls';
import { getRegistryOptions, initContentEngineRegistry } from '../lib/contentEngineRegistry';
import { saveRunToFirestore } from '../lib/saveRun';
import { pickRewriteSeed } from '../lib/pickRewriteSeed';

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

const pickString = (v: string | string[] | undefined): string | undefined => {
  return typeof v === 'string' ? v : undefined;
};

const ymdUtc = (iso: string): string => iso.slice(0, 10);

export default async function Page({ searchParams }: PageProps) {
  initContentEngineRegistry();
  const { strategies, channels, sources } = getRegistryOptions();

  const sp = (await searchParams) ?? {};

  const presetId = pickString(sp.preset);
  const strategyId = pickString(sp.strategy);
  const channelId = pickString(sp.channel);
  const sourceId = pickString(sp.source);

  // ✅ resolve は1回だけ
  const config = resolveEngineConfig({ presetId, strategyId, sourceId, channelId });

  let forcedTopic: string | undefined;
  let forcedDraft: string | undefined;
  let seedMeta: { pickedStrategyId?: string; pickedSavedAt?: string } | undefined;

  // ✅ “確定したsource” が rewrite のときだけ seed を取る
  if (config.sourceId === 'rewrite') {
    const nowIso = new Date().toISOString();

    const mode = config.strategyId === 'quiet-rewrite' ? 'quiet-only' : 'any';
    const seedKey = `${ymdUtc(nowIso)}|${config.strategyId}|${config.channelId}|${config.sourceId}`;

    const seed = await pickRewriteSeed({ limit: 50, mode, seedKey });

    forcedTopic = seed?.topic;
    forcedDraft = seed?.content;

    seedMeta = {
      pickedStrategyId: seed?.strategyId,
      pickedSavedAt: seed?.savedAt,
    };
  }

  // ✅ ここが超薄い：解決済みconfigをそのまま渡す
  const { article } = runResolvedContentEngine({
    config,
    topic: forcedTopic,
    draft: forcedDraft,
  });

  await saveRunToFirestore({ article });

  return (
    <main style={{ padding: 16, lineHeight: 1.7 }}>
      <EngineControls strategies={strategies} channels={channels} sources={sources} />

      {(presetId || config.warnings.length > 0) && (
        <p style={{ opacity: 0.7 }}>
          {presetId ? `preset: ${presetId}` : 'preset: -'}
          {config.warnings.length > 0 ? ` / warnings: ${config.warnings.join(' | ')}` : ''}
        </p>
      )}

      <h1>{article.title}</h1>

      {config.sourceId === 'rewrite' && (
        <p style={{ opacity: 0.7 }}>
          seed: {seedMeta?.pickedStrategyId ?? '-'} / savedAt: {seedMeta?.pickedSavedAt ?? '-'}
        </p>
      )}

      <p style={{ opacity: 0.7 }}>
        strategy: {article.ids.strategyId} / source: {article.ids.sourceId} / channel:{' '}
        {article.ids.channelId}
      </p>

      <pre style={{ whiteSpace: 'pre-wrap' }}>{article.content}</pre>
    </main>
  );
}
