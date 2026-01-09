require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env.local'),
  quiet: true,
});

/* eslint-disable no-console */
const { execSync } = require('node:child_process');
const fs = require('node:fs');

function parseArgs() {
  // Usage:
  // node scripts/monthly-run.js YYYY-MM [--open]
  const month = process.argv[2];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Usage: node scripts/monthly-run.js YYYY-MM [--open]');
  }
  const args = process.argv.slice(3);
  const shouldOpen = args.includes('--open');
  return { month, shouldOpen };
}

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function openFile(filePath) {
  // Cross-platform "open file" (best effort)
  const platform = process.platform;

  // macOS: open
  if (platform === 'darwin') {
    run(`open ${filePath}`);
    return;
  }

  // Windows: start
  if (platform === 'win32') {
    run(`cmd /c start "" "${filePath}"`);
    return;
  }

  // Linux: xdg-open
  run(`xdg-open ${filePath}`);
}

function waitForEnter(message) {
  return new Promise((resolve) => {
    console.log(message);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

async function main() {
  const { month, shouldOpen } = parseArgs();

  const reportPath = `scripts/reports/${month}.json`;
  const insightPath = `scripts/insights/${month}.json`;

  // 1) monthly-check → report.json
  run(`node scripts/monthly-check.js ${month} --out ${reportPath}`);

  // 2) report.json → insights.json (draft)
  run(`node scripts/build-insight-from-report.js ${month} ${reportPath} ${insightPath}`);

  // 2.5) Open & pause (human edit)
  if (shouldOpen) {
    // 念のためファイル存在チェック（安心）
    if (!fs.existsSync(insightPath)) {
      throw new Error(`insight file not found: ${insightPath}`);
    }

    openFile(insightPath);

    await waitForEnter(
      `\n📝 insight を編集したら Enter で続行します（保存されていることを確認してね）\n> `,
    );
  }

  // 3) insights.json → Firestore
  run(`node scripts/write-monthly-insight.js ${month} ${insightPath}`);

  console.log(`\n✅ Done monthly pipeline for ${month}`);
  console.log(`- report:  ${reportPath}`);
  console.log(`- insight: ${insightPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
