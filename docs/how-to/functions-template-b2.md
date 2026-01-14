docs/how-to/functions-template-b2.md

Functions テンプレ（monorepo × GitHub Packages取得 × Firebase安定運用版 / B-2）

このドキュメントは、monorepo + pnpm(workspace) + Firebase Functions 環境で @tw20th/\* パッケージを「取得して使い続ける」前提の安定テンプレ。

目的：

Cloud Build（npm世界）で workspace:\* 由来の事故を起こさない

Functions は 最終的に 1 本の JS（lib/index.js） をデプロイする

@tw20th/\* は Functions の package.json に書かない（あなたの安定形）

packages の更新は publish → 各プロジェクトはアップデートで反映

🎯 結論（最重要）
Firebase Functions では「workspaceパッケージを dependencies に書かない」

Cloud Build は npm の世界で、workspace を理解しない／認証も絡むため壊れやすい

Functions は バンドル済み単体JSを生成して deploy する

@tw20th/\* は ルートで取得できる状態にしておけば良い（functions 側に宣言しない）

全体構成（推奨）
root
├─ .npmrc
├─ package.json ← @tw20th/_ をここで取得（ルート一元）
├─ pnpm-workspace.yaml
├─ apps/
│ ├─ web/ ← @tw20th/_ を dependencies に入れる
│ └─ functions/
│ ├─ src/ ← TS（@tw20th/\* を自由にimport）
│ ├─ lib/ ← esbuild出力（デプロイ対象）
│ ├─ scripts/build.mjs ← バンドル（最重要）
│ └─ package.json ← workspace依存なし（純npm依存のみ）
└─ packages/ ← ★B-2ではテンプレに含めない（推奨）

1. ルートで GitHub Packages を取得できるようにする
   /.npmrc
   @tw20th:registry=https://npm.pkg.github.com
   always-auth=true

必須：認証トークン

ローカル / CI / Vercel などビルド環境で NODE_AUTH_TOKEN をセットする。

例（ローカル）：

export NODE_AUTH_TOKEN="ghp_xxx..."
pnpm install

2. ルート package.json（@tw20th の取得はここで一元管理）

ルートに @tw20th を置くのが一番安定（あなたの経験則をテンプレとして採用）。

例：

{
"devDependencies": {
"@tw20th/content-engine": "^0.0.8",
"@tw20th/strategy-openai-basic": "^0.0.8",
"@tw20th/strategy-quiet-rewrite": "^0.0.8",
"@tw20th/strategy-quiet-spread": "^0.0.8",
"@tw20th/strategy-rewrite-basic": "^0.0.8",
"@tw20th/strategy-seo-basic": "^0.0.8"
}
}

strategy の種類は使う分だけでOK。

3. web 側は @tw20th を dependencies に入れる

web はクラウドビルドで @tw20th/_ を取得できる必要があるため、workspace:_ は使わず 実バージョンにする。

apps/web/package.json 例：

{
"dependencies": {
"@tw20th/content-engine": "^0.0.8",
"@tw20th/strategy-openai-basic": "^0.0.8",
"@tw20th/strategy-quiet-rewrite": "^0.0.8",
"@tw20th/strategy-quiet-spread": "^0.0.8",
"@tw20th/strategy-rewrite-basic": "^0.0.8",
"@tw20th/strategy-seo-basic": "^0.0.8",
"next": "16.1.1",
"react": "19.2.3",
"react-dom": "19.2.3"
}
}

4. Functions の package.json ルール（超重要）

apps/functions/package.json は 純npm依存だけにする。
@tw20th/\* を書かない（これがあなたの安定形）。

{
"name": "functions",
"private": true,
"main": "lib/index.js",
"type": "commonjs",
"engines": { "node": "20" },
"scripts": {
"build": "node scripts/build.mjs",
"serve": "firebase emulators:start --only functions",
"deploy": "firebase deploy --only functions"
},
"dependencies": {
"cron-parser": "^4.9.0",
"firebase-admin": "^12.0.0",
"firebase-functions": "^4.7.0"
},
"devDependencies": {
"@types/node": "^20",
"esbuild": "^0.25.12",
"typescript": "^5.5.0"
}
}

5. Functions ビルド（最重要ファイル）
   apps/functions/scripts/build.mjs

役割：

src/index.ts を起点に 単体JSを生成

生成物に @tw20th/ import が残っていたら失敗（本番事故防止）

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

6. Functions 初期化は「1回だけ」行う（推奨）

src/index.ts で直接呼ぶより、initEngine() でガードすると安定する。

apps/functions/src/lib/initEngine.ts

import { bootstrapContentEngine } from '@tw20th/content-engine';
import { registerStrategies } from './registerStrategies';

let initialized = false;

export const initEngine = (): void => {
if (initialized) return;
initialized = true;

bootstrapContentEngine();
registerStrategies();
};

apps/functions/src/index.ts

import { initEngine } from './lib/initEngine';

initEngine();

export { tick } from './schedules/tick';
export { runDue } from './http/runDue';

7. デプロイ前チェック（必須）
   pnpm -C apps/functions build
   grep -R "@tw20th/" apps/functions/lib/index.js || echo "no @tw20th imports ✅"
   firebase deploy --only functions

8. 新規プロジェクト開始の最短手順（テンプレ運用）

テンプレを複製

NODE_AUTH_TOKEN を設定

pnpm install

pnpm -C apps/functions build

firebase deploy --only functions

pnpm -C apps/web dev / build

9. パッケージ更新を反映する手順（運用）

まず packages を publish（例：0.0.9）

各プロジェクト側：

pnpm up @tw20th/content-engine @tw20th/strategy-\*
pnpm -C apps/functions build
firebase deploy --only functions
pnpm -C apps/web build

🧠 設計思想まとめ

Cloud Build は “npmしか知らない世界”

Functions は “成果物置き場”（単体JSが正義）

monorepo は “開発効率のため”

@tw20th/\* は ルートで取得して、Functions はバンドルに取り込む
→ package.json に書かない（あなたの安定形）

追伸：ゆずはの一言の理解（結論）

「firebaseを使うときは、ビルドの対応をルートのpackageに入れてね。ってことだけ」

ほぼそれでOK。より正確にはこう：

ルートで @tw20th を取得できる状態にする（= install が通る）

Functions はそれをバンドルして成果物にする（= Cloud側に依存を渡さない）

この2点だけ守れば、他は増えても壊れにくい。
