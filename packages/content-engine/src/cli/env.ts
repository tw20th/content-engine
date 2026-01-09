// packages/content-engine/src/cli/env.ts
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export const loadEnv = (): void => {
  // 優先順位：ENV_FILE > .env.local > .env
  const envFile =
    process.env.ENV_FILE ??
    (fs.existsSync(path.join(process.cwd(), '.env.local')) ? '.env.local' : '.env');

  const abs = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
  if (fs.existsSync(abs)) {
    dotenv.config({ path: abs, quiet: true });
  }
};
