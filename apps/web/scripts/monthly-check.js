require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env.local'),
  quiet: true,
});

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing env vars: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY',
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getFirestore();
}

function parseArgs() {
  // Usage:
  // node scripts/monthly-check.js YYYY-MM [--out path/to/report.json] [--format text|json]
  const month = process.argv[2];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error(
      'Usage: node scripts/monthly-check.js YYYY-MM [--out report.json] [--format text|json]',
    );
  }

  const args = process.argv.slice(3);
  const pick = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const out = pick('--out');
  const format = pick('--format') ?? 'text'; // text | json

  return { month, out, format };
}

function monthRangeYmd(month) {
  const [y, m] = month.split('-').map((v) => Number(v));
  const start = `${month}-01`;
  const endDate = new Date(Date.UTC(y, m, 0)); // last day of month (UTC)
  const end = `${month}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
}

function inc(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function topEntries(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

async function fetchRuns(db, startYmd, endYmd) {
  // savedAt は ISO string の前提（あなたの現状と一致）
  const startIso = `${startYmd}T00:00:00.000Z`;
  const endIso = `${endYmd}T23:59:59.999Z`;

  const snap = await db
    .collection('contentEngineRuns')
    .where('savedAt', '>=', startIso)
    .where('savedAt', '<=', endIso)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function buildReport(month, startYmd, endYmd, docs) {
  const byStrategy = {};
  const bySource = {};
  const byChannel = {};
  const byTopic = {};
  const combos = {};

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
      if (!arr.includes(doc.title) && arr.length < 3) {
        arr.push(doc.title);
      }
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
    range: { startYmd, endYmd },
    docsCount: docs.length,
    byStrategy: topEntries(byStrategy).map(([id, count]) => ({ id, count })),
    bySource: topEntries(bySource).map(([id, count]) => ({ id, count })),
    byChannel: topEntries(byChannel).map(([id, count]) => ({ id, count })),
    topCombos,
    topTopics,
    generatedAt: new Date().toISOString(),
  };
}

function printReportText(report) {
  console.log(`[content-engine] Monthly check: ${report.month}`);
  console.log(`Range (ymd): ${report.range.startYmd} .. ${report.range.endYmd}`);
  console.log('');
  console.log(`Docs: ${report.docsCount}`);
  console.log('');

  const printBlock = (title, list) => {
    console.log(`== ${title} ==`);
    for (const row of list) console.log(`- ${row.id}: ${row.count}`);
    console.log('');
  };

  printBlock('By Strategy', report.byStrategy);
  printBlock('By Source', report.bySource);
  printBlock('By Channel', report.byChannel);

  console.log('== Top combos (strategy | source | channel) ==');
  for (const c of report.topCombos) {
    console.log(`- ${c.key}: ${c.count}`);
    if (c.samples?.length) console.log(`  samples: ${c.samples.join(' / ')}`);
  }
  console.log('');

  console.log('== Top topics ==');
  for (const t of report.topTopics) console.log(`- ${t.topic}: ${t.count}`);
  console.log('');
}

function writeJson(outPath, obj) {
  const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), 'utf8');
  return abs;
}

async function main() {
  const { month, out, format } = parseArgs();
  const { start, end } = monthRangeYmd(month);
  const db = getDb();

  const docs = await fetchRuns(db, start, end);
  const report = buildReport(month, start, end, docs);

  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReportText(report);
  }

  if (out) {
    const abs = writeJson(out, report);
    console.log(`✅ Wrote report: ${abs}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
