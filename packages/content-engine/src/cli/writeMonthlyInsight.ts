// packages/content-engine/src/cli/writeMonthlyInsight.ts
import fs from 'node:fs';
import path from 'node:path';
import { getAdminDb } from './firebaseAdmin.js';

type MonthlyInsight = {
  month: string;
  summary?: { feeling?: string };
  observations?: string[];
  decisions?: string[];
  experiments?: string[];
  stopDoing?: string[];
  notes?: string;
  decidedAt: string;
};

const defaultPayload = (month: string): MonthlyInsight => ({
  month,
  summary: { feeling: 'quiet' },

  observations: ['（ここに今月の観測を書く）'],
  decisions: ['（来月やることを1つだけ書く）'],
  experiments: ['（試すことがあれば1つだけ）'],
  stopDoing: ['（やめることがあれば1つだけ）'],

  notes:
    '分析は正解を決めるためではなく、次に何を試すかを決めるため。数字よりも疲れなさを優先する。',

  decidedAt: new Date().toISOString(),
});

const loadFromFile = (filePath: string): Record<string, unknown> => {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
};

export const writeMonthlyInsight = async (month: string, filePath?: string): Promise<void> => {
  const db = getAdminDb();

  let payload: MonthlyInsight = defaultPayload(month);

  if (filePath) {
    const fromFile = loadFromFile(filePath);
    payload = {
      ...(payload as unknown as Record<string, unknown>),
      ...fromFile,
      month,
      decidedAt: payload.decidedAt, // 実行時刻で固定
    } as MonthlyInsight;
  }

  await db.collection('monthlyInsights').doc(month).set(payload, { merge: true });
};
