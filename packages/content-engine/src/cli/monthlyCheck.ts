// packages/content-engine/src/cli/monthlyCheck.ts
import fs from 'node:fs';
import path from 'node:path';
import { getAdminDb } from './firebaseAdmin.js';

type RunDoc = {
  strategyId?: string;
  sourceId?: string;
  channelId?: string;
  topic?: string;
  title?: string;
  savedAt?: string;
};

export type MonthlyReport = {
  month: string;
  range: { startYmd: string; endYmd: string };
  docsCount: number;
  byStrategy: { id: string; count: number }[];
  bySource: { id: string; count: number }[];
  byChannel: { id: string; count: number }[];
  topCombos: { key: string; count: number; samples: string[] }[];
  topTopics: { topic: string; count: number }[];
  generatedAt: string;
};

const monthRangeYmd = (month: string) => {
  const [y, m] = month.split('-').map((v) => Number(v));
  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(y, m, 0)); // last day (UTC)
  const end = `${month}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
};

const inc = (map: Record<string, number>, key: string) => {
  map[key] = (map[key] ?? 0) + 1;
};

const topEntries = (map: Record<string, number>) => Object.entries(map).sort((a, b) => b[1] - a[1]);

const fetchRuns = async (startYmd: string, endYmd: string): Promise<RunDoc[]> => {
  const db = getAdminDb();

  const startIso = `${startYmd}T00:00:00.000Z`;
  const endIso = `${endYmd}T23:59:59.999Z`;

  const snap = await db
    .collection('contentEngineRuns')
    .where('savedAt', '>=', startIso)
    .where('savedAt', '<=', endIso)
    .get();

  return snap.docs.map((d) => d.data() as RunDoc);
};

export const buildMonthlyReport = async (month: string): Promise<MonthlyReport> => {
  const { start, end } = monthRangeYmd(month);
  const docs = await fetchRuns(start, end);

  const byStrategy: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  const combos: Record<string, { count: number; samples: string[] }> = {};

  for (const doc of docs) {
    const strategyId = doc.strategyId ?? 'unknown';
    const sourceId = doc.sourceId ?? 'unknown';
    const channelId = doc.channelId ?? 'unknown';
    const topic = doc.topic ?? '(no-topic)';

    inc(byStrategy, strategyId);
    inc(bySource, sourceId);
    inc(byChannel, channelId);
    inc(byTopic, topic);

    const comboKey = `${strategyId} | ${sourceId} | ${channelId}`;
    if (!combos[comboKey]) combos[comboKey] = { count: 0, samples: [] };
    combos[comboKey].count += 1;

    if (doc.title) {
      const arr = combos[comboKey].samples;
      if (!arr.includes(doc.title) && arr.length < 3) arr.push(doc.title);
    }
  }

  const topCombos = Object.entries(combos)
    .map(([key, v]) => ({ key, count: v.count, samples: v.samples }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const topTopics = topEntries(byTopic)
    .slice(0, 12)
    .map(([topic, count]) => ({ topic, count }));

  return {
    month,
    range: { startYmd: start, endYmd: end },
    docsCount: docs.length,
    byStrategy: topEntries(byStrategy).map(([id, count]) => ({ id, count })),
    bySource: topEntries(bySource).map(([id, count]) => ({ id, count })),
    byChannel: topEntries(byChannel).map(([id, count]) => ({ id, count })),
    topCombos,
    topTopics,
    generatedAt: new Date().toISOString(),
  };
};

export const printReportText = (report: MonthlyReport): void => {
  // eslint-disable-next-line no-console
  console.log(`[content-engine] Monthly check: ${report.month}`);
  // eslint-disable-next-line no-console
  console.log(`Range (ymd): ${report.range.startYmd} .. ${report.range.endYmd}`);
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(`Docs: ${report.docsCount}`);
  // eslint-disable-next-line no-console
  console.log('');

  const printBlock = (title: string, list: { id: string; count: number }[]) => {
    // eslint-disable-next-line no-console
    console.log(`== ${title} ==`);
    for (const row of list) {
      // eslint-disable-next-line no-console
      console.log(`- ${row.id}: ${row.count}`);
    }
    // eslint-disable-next-line no-console
    console.log('');
  };

  printBlock('By Strategy', report.byStrategy);
  printBlock('By Source', report.bySource);
  printBlock('By Channel', report.byChannel);

  // eslint-disable-next-line no-console
  console.log('== Top combos (strategy | source | channel) ==');
  for (const c of report.topCombos) {
    // eslint-disable-next-line no-console
    console.log(`- ${c.key}: ${c.count}`);
    if (c.samples.length) {
      // eslint-disable-next-line no-console
      console.log(`  samples: ${c.samples.join(' / ')}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log('');

  // eslint-disable-next-line no-console
  console.log('== Top topics ==');
  for (const t of report.topTopics) {
    // eslint-disable-next-line no-console
    console.log(`- ${t.topic}: ${t.count}`);
  }
  // eslint-disable-next-line no-console
  console.log('');
};

export const writeJson = (outPath: string, obj: unknown): string => {
  const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), 'utf8');
  return abs;
};
