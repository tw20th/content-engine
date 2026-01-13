// apps/functions/scripts/build.mjs
import esbuild from 'esbuild';

const EXTERNALS = [
  'firebase-admin',
  'firebase-functions',
  'cron-parser',
  '@tw20th/content-engine',
  '@tw20th/strategy-quiet-spread',
  '@tw20th/strategy-quiet-rewrite',
  '@tw20th/strategy-rewrite-basic',
  '@tw20th/strategy-seo-basic',
  '@tw20th/strategy-openai-basic',
];

await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: EXTERNALS,
});

console.log('[functions] build ok');
