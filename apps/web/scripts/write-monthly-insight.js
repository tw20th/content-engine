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
  // node scripts/write-monthly-insight.js 2026-02 [path/to/insight.json]
  const month = process.argv[2];
  const file = process.argv[3];

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Usage: node scripts/write-monthly-insight.js YYYY-MM [insight.json]');
  }

  return { month, file };
}

function defaultPayload(month) {
  return {
    month,
    summary: { feeling: 'quiet' }, // quiet / neutral / noisy

    observations: ['（ここに今月の観測を書く）'],
    decisions: ['（来月やることを1つだけ書く）'],
    experiments: ['（試すことがあれば1つだけ）'],
    stopDoing: ['（やめることがあれば1つだけ）'],

    notes:
      '分析は正解を決めるためではなく、次に何を試すかを決めるため。数字よりも疲れなさを優先する。',

    decidedAt: new Date().toISOString(),
  };
}

function loadPayloadFromFile(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  const json = JSON.parse(raw);
  return json;
}

async function main() {
  const db = getDb();
  const { month, file } = parseArgs();

  let payload = defaultPayload(month);

  if (file) {
    const fromFile = loadPayloadFromFile(file);
    payload = {
      ...payload,
      ...fromFile,
      month, // month は CLI 引数を優先
      decidedAt: payload.decidedAt, // decidedAt は実行時刻で上書き（固定化しない）
    };
  }

  await db.collection('monthlyInsights').doc(month).set(payload, { merge: true });
  console.log(`✅ Wrote monthlyInsights/${month}`);
  if (!file) {
    console.log(
      'ℹ️ No file provided. Wrote template payload. Provide a JSON file to write real insights.',
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
