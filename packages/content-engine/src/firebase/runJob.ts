import { onRequest } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import type { GenerateInput, GeneratedArticle } from '../types.js';
import { getStrategy } from '../registry/strategies.js';
import { resolveEngineConfig } from '../registry/resolve.js';

type RunDoc = {
  status?: 'queued' | 'processing' | 'success' | 'error';
  createdAt?: number;
  updatedAt?: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;

  jobId?: string;

  strategyId?: string;
  payload?: unknown;

  result?: GeneratedArticle | null;

  resolved?: {
    strategyId: string;
    sourceId: string;
    channelId: string;
    presetId: string;
    warnings: string[];
  };
};

const getAdminDb = () => {
  if (getApps().length === 0) initializeApp();
  return getFirestore();
};

const asGenerateInput = (payload: unknown): Partial<GenerateInput> => {
  if (!payload || typeof payload !== 'object') return {};
  return payload as Partial<GenerateInput>;
};

export const runJob = onRequest({ region: 'asia-northeast1' }, async (_req, res) => {
  const db = getAdminDb();
  const now = Date.now();

  // ref を外に出して、例外時にも error 終端できるようにする
  let ref: { update: (data: Record<string, unknown>) => Promise<unknown> } | null = null;
  let runId: string | null = null;

  try {
    const snap = await db
      .collection('runs')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(200).json({ ok: true, processed: 0, now });
      return;
    }

    const doc = snap.docs[0];
    ref = doc.ref;
    runId = doc.id;

    // queued → processing（競合対策）
    const runData = await db.runTransaction(async (tx) => {
      const cur = await tx.get(doc.ref);
      const data = (cur.data() ?? {}) as RunDoc;

      if (data.status !== 'queued') return null;

      tx.update(doc.ref, {
        status: 'processing',
        startedAt: data.startedAt ?? now,
        updatedAt: now,
        error: '',
      });

      return data;
    });

    if (!runData) {
      res.status(200).json({ ok: true, processed: 0, now, skipped: true });
      return;
    }

    const strategyIdRaw = runData.strategyId ?? '';
    const payloadPartial = asGenerateInput(runData.payload);

    const resolved = resolveEngineConfig({
      strategyId: strategyIdRaw || undefined,
      sourceId: payloadPartial.sourceId,
      channelId: payloadPartial.channelId,
    });

    const strategy = getStrategy(resolved.strategyId);

    if (!strategy) {
      const msg = `Strategy not found: "${resolved.strategyId}". Available: (${[]})`;

      await doc.ref.update({
        status: 'error',
        finishedAt: Date.now(),
        updatedAt: Date.now(),
        error: msg,
        result: null,
        resolved: {
          strategyId: resolved.strategyId,
          sourceId: resolved.sourceId,
          channelId: resolved.channelId,
          presetId: resolved.presetId ?? '',
          warnings: resolved.warnings,
        },
      } satisfies Partial<RunDoc>);

      res.status(200).json({ ok: false, processed: 1, runId, error: msg, now: Date.now() });
      return;
    }

    const input: GenerateInput = {
      topic: payloadPartial.topic ?? 'テスト記事',
      draft: payloadPartial.draft,
      sourceId: resolved.sourceId,
      channelId: resolved.channelId,
    };

    const result = await strategy.generate(input);

    await doc.ref.update({
      status: 'success',
      finishedAt: Date.now(),
      updatedAt: Date.now(),
      error: '',
      result,
      resolved: {
        strategyId: resolved.strategyId,
        sourceId: resolved.sourceId,
        channelId: resolved.channelId,
        presetId: resolved.presetId ?? '',
        warnings: resolved.warnings,
      },
    } satisfies Partial<RunDoc>);

    res.status(200).json({
      ok: true,
      processed: 1,
      runId,
      strategyId: resolved.strategyId,
      warnings: resolved.warnings,
      title: result.title,
      now: Date.now(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    // ✅ ここが「processingで止まらない」本体：ref が分かってるなら error 終端
    if (ref) {
      try {
        await ref.update({
          status: 'error',
          finishedAt: Date.now(),
          updatedAt: Date.now(),
          error: msg,
          result: null,
        });
      } catch {
        // best-effort
      }
    }

    res.status(500).json({ ok: false, runId, error: msg, now: Date.now() });
  }
});
