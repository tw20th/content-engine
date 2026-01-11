//apps/web/lib/saveRun.ts
import type { GeneratedArticle } from '@content-engine/core';
import { getAdminDb } from './firebaseAdmin';

type SaveRunInput = {
  article: GeneratedArticle;
};

const toYmdUtc = (iso: string): string => {
  // createdAtはISO前提。UTC日付でまとめる（環境差が出にくくて楽）
  return iso.slice(0, 10); // "YYYY-MM-DD"
};

const normalizeKey = (s: string): string => {
  // FirestoreのdocIdに使える安全な形へ（長すぎも防ぐ）
  // 日本語topicも入るので、URIエンコードして長さを抑える
  return encodeURIComponent(s).slice(0, 120);
};

export const saveRunToFirestore = async ({ article }: SaveRunInput): Promise<void> => {
  if (process.env.SAVE_TO_FIRESTORE !== 'true') return;

  const db = getAdminDb();

  const ymd = toYmdUtc(article.createdAt);

  // ✅ 同一日・同一組み合わせは上書き
  const runKey = [
    ymd,
    article.ids.strategyId,
    article.ids.sourceId,
    article.ids.channelId,
    normalizeKey(article.topic),
  ].join('__');

  const doc = {
    topic: article.topic,
    title: article.title,
    content: article.content,

    strategyId: article.ids.strategyId,
    sourceId: article.ids.sourceId,
    channelId: article.ids.channelId,

    createdAt: article.createdAt,
    savedAt: new Date().toISOString(),
    ymd,
    runKey,
  };

  await db.collection('contentEngineRuns').doc(runKey).set(doc, { merge: true });
};
