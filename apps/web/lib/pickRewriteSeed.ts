//apps/web/lib/pickRewriteSeed.ts
import { getAdminDb } from './firebaseAdmin';

export type RewriteSeed = {
  topic: string;
  content?: string;
  strategyId?: string;
  sourceId?: string;
  channelId?: string;
  savedAt?: string;
};

type PickRewriteSeedArgs = {
  limit?: number;
  mode?: 'any' | 'quiet-only';
  seedKey: string;
};

const hashToIndex = (seed: string, modulo: number): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : h % modulo;
};

const isRewriteSeed = (x: RewriteSeed | null): x is RewriteSeed => x !== null;

export const pickRewriteSeed = async ({
  limit = 30,
  mode = 'any',
  seedKey,
}: PickRewriteSeedArgs): Promise<RewriteSeed | null> => {
  const db = getAdminDb();

  const snap = await db
    .collection('contentEngineRuns')
    .orderBy('savedAt', 'desc')
    .limit(limit)
    .get();

  const all: RewriteSeed[] = snap.docs
    .map((d): RewriteSeed | null => {
      const data = d.data() as Partial<RewriteSeed>;
      if (!data.topic) return null;

      // ここで RewriteSeed 型に “寄せる”
      return {
        topic: data.topic,
        content: data.content,
        strategyId: data.strategyId,
        sourceId: data.sourceId,
        channelId: data.channelId,
        savedAt: data.savedAt,
      };
    })
    .filter(isRewriteSeed);

  if (all.length === 0) return null;

  const quietStrategies = new Set(['quiet-spread', 'quiet-rewrite']);

  const filtered =
    mode === 'quiet-only'
      ? all.filter((x) => !!x.strategyId && quietStrategies.has(x.strategyId))
      : all;

  const pool = filtered.length > 0 ? filtered : all;

  const idx = hashToIndex(seedKey, pool.length);
  return pool[idx] ?? pool[0] ?? null;
};
