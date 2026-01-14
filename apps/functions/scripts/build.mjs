// apps/functions/scripts/build.mjs
import esbuild from 'esbuild';
import fs from 'node:fs';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'lib/index.js',
  sourcemap: true,
  external: ['firebase-admin', 'firebase-functions', 'cron-parser'],
});

const code = fs.readFileSync('lib/index.js', 'utf8');
if (code.includes('@tw20th/')) {
  console.error('[functions] ERROR: @tw20th imports remain in bundle');
  process.exit(1);
}

console.log('[functions] build ok');
