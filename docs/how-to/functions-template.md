Functions テンプレ（monorepo × packages 安定運用版）

このドキュメントは、
monorepo + workspace + Firebase Functions 構成において、

Cloud Build で workspace:\* エラーを出さない

@tw20th/\* パッケージを安全に利用する

ローカルと本番で挙動がズレない

ための 推奨テンプレ構成 をまとめたものです。

🎯 結論（最重要）

Firebase Functions では「workspace パッケージを直接使わない」

Functions は 最終的に 1 本の JS にバンドルする

Cloud Build（npm）は workspace:\* を理解できない

そのため Functions の dependencies に workspace: を書かない\*

👉 monorepo の packages は ビルド時に取り込む のが正解

全体構成イメージ
apps/
functions/
src/ ← TypeScript（@tw20th/_ を自由に import）
lib/ ← esbuild で生成された単体JS（デプロイ対象）
scripts/
build.mjs ← monorepo対応ビルド
package.json ← firebase用（workspace依存なし）
packages/
content-engine/
strategy-_

1. Functions の package.json ルール
   ❌ やってはいけない
   "dependencies": {
   "@tw20th/content-engine": "workspace:\*"
   }

→ Cloud Build で EUNSUPPORTEDPROTOCOL が出る

✅ 正解（テンプレ）
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

📌 workspace パッケージは一切書かない

2. Functions ビルドの考え方
   方針

TypeScript では @tw20th/\* を使ってよい

ビルド時に monorepo の packages/src を直接取り込む

出力された JS には @tw20th/\* を残さない

3. build.mjs（最重要ファイル）
   役割

monorepo の packages/\*/src を解決

Firebase Functions 用に 1 本の JS を生成

危険な import が残っていたらビルドを失敗させる

テンプレ
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd(); // apps/functions
const entry = path.join(root, "src/index.ts");
const out = path.join(root, "lib/index.js");

// monorepo ルート
const repoRoot = path.resolve(root, "..", "..");

const aliasPlugin = {
name: "monorepo-alias",
setup(build) {
build.onResolve({ filter: /^@tw20th\/content-engine$/ }, () => ({
path: path.join(repoRoot, "packages/content-engine/src/index.ts"),
}));

    build.onResolve({ filter: /^@tw20th\/strategy-(.+)$/ }, (args) => {
      const m = args.path.match(/^@tw20th\/(strategy-.+)$/);
      if (!m) return null;
      return {
        path: path.join(repoRoot, `packages/${m[1]}/src/index.ts`),
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
external: ["firebase-admin", "firebase-functions", "cron-parser"],
});

// 安全装置
const code = fs.readFileSync(out, "utf8");
if (code.includes("@tw20th/")) {
console.error("[functions] ERROR: @tw20th imports remain in bundle");
process.exit(1);
}

console.log("[functions] build ok");

4. 初期化は「1回だけ」行う
   NG

import 時に bootstrap が走る

関数ごとに register が走る

OK

initEngine() を作り、index.ts で1回だけ呼ぶ

src/lib/initEngine.ts
import { bootstrapContentEngine } from "@tw20th/content-engine";
import { registerStrategies } from "./registerStrategies";

let initialized = false;

export const initEngine = (): void => {
if (initialized) return;
initialized = true;

bootstrapContentEngine();
registerStrategies();
};

src/index.ts
import { initEngine } from "./lib/initEngine";

initEngine();

export { tick } from "./schedules/tick";
export { runDue } from "./http/runDue";

5. デプロイ前チェック（必須）
   pnpm -C apps/functions build
   grep -R "@tw20th/" apps/functions/lib/index.js || echo "no @tw20th imports ✅"

これが通れば Cloud Build でも安全。

6. よくあるトラブルと原因
   ❌ Cloud Build で workspace:\* エラー

Functions の package.json に workspace が残っている

❌ ローカルでは動くがデプロイで落ちる

バンドル後の JS に @tw20th/\* が残っている

❌ 関数が2回以上動く

bootstrap / register を import 時に実行している

✅ このテンプレの守備範囲

他のサイトでもそのまま再利用可能

packages 側の変更が増えても Functions 側は安定

Firebase SDK を packages に押し込まなくてよい

🧠 設計思想まとめ

Functions は「成果物置き場」

monorepo は「開発効率のため」

Cloud Build は「npmしか知らない世界」

👉 だから
Functions = バンドル済み単体JS
が一番事故らない。
