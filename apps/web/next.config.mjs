// apps/web/next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@content-engine/core', '@content-engine/strategy-quiet-spread'],
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
