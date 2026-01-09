#!/usr/bin/env node
// packages/content-engine/src/cli/index.ts
import { loadEnv } from './env.js';
import { runMonthlyPipeline } from './monthly.js';

const usage = () => {
  // eslint-disable-next-line no-console
  console.log(`
content-engine CLI

Usage:
  content-engine monthly YYYY-MM [--open] [--outDir scripts]

Env:
  Reads ENV_FILE or .env.local or .env (cwd)
  Needs: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
`);
};

const main = async () => {
  loadEnv();

  // node / script を除いた argv
  const argv = process.argv.slice(2);

  // pnpm/npm の `--` を除去
  const args = argv[0] === '--' ? argv.slice(1) : argv;

  const [cmd, ...rest] = args;

  if (!cmd || cmd === '-h' || cmd === '--help') {
    usage();
    process.exit(0);
  }

  if (cmd === 'monthly') {
    const month = rest[0];
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Usage: content-engine monthly YYYY-MM [--open] [--outDir scripts]');
    }

    const open = rest.includes('--open');

    const pick = (flag: string) => {
      const i = rest.indexOf(flag);
      return i >= 0 ? rest[i + 1] : undefined;
    };

    const outDir = pick('--outDir');

    await runMonthlyPipeline({ month, open, outDir });
    return;
  }

  usage();
  throw new Error(`Unknown command: ${cmd}`);
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
