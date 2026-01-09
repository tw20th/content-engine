require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env.local'),
  quiet: true,
});

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

function readJson(p) {
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function writeJson(p, obj) {
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), 'utf8');
  return abs;
}

function top1(list) {
  return list?.[0] ? `${list[0].id} (${list[0].count})` : '-';
}

function buildInsight(report) {
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

    // ここは「1つだけ」手で直す前提の下書き
    decisions: ['（来月やることを1つだけ書く）'],
    experiments: ['（試すことがあれば1つだけ）'],
    stopDoing: ['（やめることがあれば1つだけ）'],

    notes:
      '分析は正解を決めるためではなく、次に何を試すかを決めるため。数字よりも疲れなさを優先する。',
  };
}

function parseArgs() {
  // Usage:
  // node scripts/build-insight-from-report.js 2026-01 scripts/reports/2026-01.json scripts/insights/2026-01.json
  const month = process.argv[2];
  const reportPath = process.argv[3];
  const outPath = process.argv[4];

  if (!month || !/^\d{4}-\d{2}$/.test(month) || !reportPath || !outPath) {
    throw new Error(
      'Usage: node scripts/build-insight-from-report.js YYYY-MM report.json insight.json',
    );
  }
  return { month, reportPath, outPath };
}

function main() {
  const { reportPath, outPath } = parseArgs();
  const report = readJson(reportPath);
  const insight = buildInsight(report);
  const abs = writeJson(outPath, insight);
  console.log(`✅ Wrote insight draft: ${abs}`);
}

main();
