// packages/content-engine/src/cli/monthly.ts
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import {
  buildMonthlyReport,
  printReportText,
  writeJson as writeReportJson,
} from './monthlyCheck.js';
import {
  buildInsightFromReport,
  readReportFile,
  writeJson as writeInsightJson,
} from './buildInsight.js';
import { writeMonthlyInsight } from './writeMonthlyInsight.js';

const run = (cmd: string) => {
  // eslint-disable-next-line no-console
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

const openFile = (filePath: string) => {
  const platform = process.platform;
  if (platform === 'darwin') return run(`open ${filePath}`);
  if (platform === 'win32') return run(`cmd /c start "" "${filePath}"`);
  return run(`xdg-open ${filePath}`);
};

const waitForEnter = (message: string) =>
  new Promise<void>((resolve) => {
    // eslint-disable-next-line no-console
    console.log(message);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });

export type MonthlyArgs = {
  month: string; // YYYY-MM
  open?: boolean;
  outDir?: string; // default: scripts
};

export const runMonthlyPipeline = async (args: MonthlyArgs) => {
  const outDir = args.outDir ?? 'scripts';

  const reportPath = `${outDir}/reports/${args.month}.json`;
  const insightPath = `${outDir}/insights/${args.month}.json`;

  // 1) monthly-check → report.json
  const report = await buildMonthlyReport(args.month);
  printReportText(report);
  const reportAbs = writeReportJson(reportPath, report);

  // 2) report.json → insights.json (draft)
  const reportFromFile = readReportFile(reportAbs);
  const insight = buildInsightFromReport(reportFromFile);
  const insightAbs = writeInsightJson(insightPath, insight);

  // 2.5) open + pause
  if (args.open) {
    if (!fs.existsSync(insightAbs)) throw new Error(`insight file not found: ${insightAbs}`);
    openFile(insightAbs);
    await waitForEnter(
      `\n📝 insight を編集したら Enter で続行します（保存されていることを確認してね）\n> `,
    );
  }

  // 3) insights.json → Firestore
  await writeMonthlyInsight(args.month, insightAbs);

  // eslint-disable-next-line no-console
  console.log(`\n✅ Done monthly pipeline for ${args.month}`);
  // eslint-disable-next-line no-console
  console.log(`- report:  ${reportPath}`);
  // eslint-disable-next-line no-console
  console.log(`- insight: ${insightPath}`);
};
