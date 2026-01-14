✅ Functions テンプレ（そのままコピペで使える）

1. apps/functions/package.json（テンプレ）

依存は Functions 自体に必要なものだけ。@tw20th/\* は 入れない。

{
"name": "functions",
"private": true,
"type": "module",
"main": "lib/index.js",
"engines": { "node": "20" },
"scripts": {
"build": "node scripts/build.mjs",
"predeploy": "pnpm build"
},
"dependencies": {
"firebase-admin": "^12.0.0",
"firebase-functions": "^4.7.0",
"cron-parser": "^4.9.0"
},
"devDependencies": {
"esbuild": "^0.25.12"
}
}

重要：dependencies に workspace:\* が 1個でもあると Cloud Build の npm で落ちる可能性が高いです（今回のやつ）。

2. apps/functions/scripts/build.mjs（テンプレ）

monorepoの packages/\* を ソースからまとめてバンドルします。
さらに「@tw20th が残ってたら失敗」も入れておきます。

import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd(); // apps/functions
const entry = path.join(root, "src/index.ts");
const out = path.join(root, "lib/index.js");

// monorepoルート（apps/functions の1つ上がルート前提）
const repoRoot = path.resolve(root, "..", "..");

// ✅ packages/_ を解決できるようにする（これが超大事）
const aliasPlugin = {
name: "monorepo-alias",
setup(build) {
// @tw20th/_ を packages/\*/src に寄せる
build.onResolve({ filter: /^@tw20th\/content-engine$/ }, () => ({
path: path.join(repoRoot, "packages/content-engine/src/index.ts"),
}));

    build.onResolve({ filter: /^@tw20th\/strategy-(.+)$/ }, (args) => {
      const m = args.path.match(/^@tw20th\/(strategy-.+)$/);
      if (!m) return null;
      const pkg = m[1];
      return {
        path: path.join(repoRoot, `packages/${pkg}/src/index.ts`),
      };
    });

},
};

await build({
entryPoints: [entry],
outfile: out,
bundle: true,
platform: "node",
target: "node20",
format: "cjs",
sourcemap: true,
plugins: [aliasPlugin],

// firebase-admin/functions は巨大なので外出し（好み）
external: ["firebase-admin", "firebase-functions", "cron-parser"],
});

// ✅ 安全装置：バンドル後に @tw20th が残ってたら失敗
const code = fs.readFileSync(out, "utf8");
if (code.includes("@tw20th/")) {
console.error("\n[functions] ERROR: bundle still contains @tw20th/\* imports\n");
process.exit(1);
}

console.log("[functions] build ok");

これで Cloud Build 側は @tw20th/_ を一切解決しなくてよくなる
（= workspace:_ 問題が出にくい）

3. apps/functions/tsconfig.json（テンプレ）

TypeScript の型チェックは普通に通す用。バンドルは esbuild がやる。

{
"compilerOptions": {
"target": "ES2020",
"module": "NodeNext",
"moduleResolution": "NodeNext",
"lib": ["ES2020"],
"rootDir": "src",
"outDir": "lib",
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"types": ["node"]
},
"include": ["src/**/*.ts"]
}

4. apps/functions/src/index.ts（テンプレ）

ここは今のままでOK。ただし “初期化” は関数のトップで一度だけ。

import { initEngine } from "./lib/initEngine";

initEngine();

export { tick } from "./schedules/tick";
export { runDue } from "./http/runDue";

5. apps/functions/src/lib/initEngine.ts（テンプレ）

ここで bootstrapContentEngine() と戦略登録を1回だけ呼ぶ。

import { bootstrapContentEngine } from "@tw20th/content-engine";
import { registerStrategies } from "./registerStrategies";

let initialized = false;

export const initEngine = (): void => {
if (initialized) return;
initialized = true;

bootstrapContentEngine();
registerStrategies();
};

✅ 使い方（他サイトでも同じ）
ローカルでの確認
pnpm -r build
pnpm -C apps/functions build
grep -R "@tw20th/" apps/functions/lib/index.js || echo "no @tw20th imports ✅"

デプロイ
firebase deploy --only functions

✅ “今回の事故” を防ぐチェックリスト

apps/functions/package.json の dependencies に workspace:\* が無い

apps/functions/lib/index.js に @tw20th/ が残ってない

apps/functions/scripts/build.mjs が monorepo の packages/\*/src を参照してバンドルしてる

初期化（bootstrap/register）が import 時に暴発せず、initEngine() で一度だけ呼ばれる
