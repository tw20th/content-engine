import fs from 'node:fs';
import path from 'node:path';
import type { MonthlyReport } from './monthlyCheck.js';

type InsightDraft = {
  summary: { feeling: 'quiet' | 'neutral' | 'noisy' };
  observations: string[];
  decisions: string[];
  experiments: string[];
  stopDoing: string[];
  notes: string;
};

const readJson = <T>(p: string): T => {
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
};

export const writeJson = (p: string, obj: unknown): string => {
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), 'utf8');
  return abs;
};

const top1 = (list: { id: string; count: number }[] | undefined): string =>
  list?.[0] ? `${list[0].id} (${list[0].count})` : '-';

export const buildInsightFromReport = (report: MonthlyReport): InsightDraft => {
  const topChannel = top1(report.byChannel);
  const topSource = top1(report.bySource);
  const topStrategy = top1(report.byStrategy);
  const topCombo = report.topCombos?.[0]
    ? `${report.topCombos[0].key} (${report.topCombos[0].count})`
    : '-';
  const topTopic = report.topTopics?.[0]
    ? `${report.topTopics[0].topic} (${report.topTopics[0].count})`
    : '-';

  return {
    summary: { feeling: 'quiet' },

    observations: [
      `主戦場は ${topChannel}。`,
      `素材は ${topSource} が強い。`,
      `戦略は ${topStrategy} が自然に残っている。`,
      `いちばん強い組み合わせは ${topCombo}。`,
      `topic は ${topTopic} に収束していた。`,
    ],

    decisions: ['（来月やることを1つだけ書く）'],
    experiments: ['（試すことがあれば1つだけ）'],
    stopDoing: ['（やめることがあれば1つだけ）'],

    notes:
      '分析は正解を決めるためではなく、次に何を試すかを決めるため。数字よりも疲れなさを優先する。',
  };
};

export const readReportFile = (reportPath: string): MonthlyReport =>
  readJson<MonthlyReport>(reportPath);
