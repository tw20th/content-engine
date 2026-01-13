Add a Strategy（方法追加・自動実行までの完全手順）
目的

新しい strategy（生成方法） を追加し、

Web から選択できる

preset としてまとめられる

scheduledJobs により本番で自動実行される

状態までを一通り完成させる。

全体像（重要）

strategy：生成ロジックそのもの（どう書くか）

preset：strategy + source + channel の実行セット

scheduledJobs：いつ・どの preset を実行するか

tick：5分ごとに scheduledJobs を確認して実行するスケジューラ

runDue：手動で即実行するための HTTP エンドポイント

手順 1. strategy パッケージを追加する
作成場所
packages/strategy-xxx/

行うこと

packages/strategy-xxx/src/xxx.ts を作成

packages/strategy-xxx/src/index.ts で export

確認ポイント

strategyId が他と 重複していない

generate() が GeneratedArticle を返している

副作用を持たず、生成責務のみに集中している

手順 2. strategy を登録する（Web / Functions 両方）
重要ポイント

Web だけ登録しても、本番の scheduledJobs では動かない。
Functions 側でも確実に登録されている必要がある。

2-1. Functions 側（必須）
ファイル
packages/content-engine/src/bootstrap.ts

行うこと
import { myNewStrategy } from '@tw20th/strategy-xxx';

registerStrategy(myNewStrategy);

bootstrapContentEngine() は
Functions 起動時（tick / runDue）に必ず呼ばれる。

2-2. Web 側（UI 用）
ファイル
apps/web/lib/contentEngineRegistry.ts

行うこと
registerStrategy(myNewStrategy);

Web で選択肢として表示するために必要。

手順 3. preset を追加する（推奨）

preset を作ることで
strategy + source + channel を
「ひとまとまりの実行設定」として扱える。

ファイル
packages/content-engine/src/registry/presets.ts

追加例
{
presetId: 'my-preset',
label: 'my-preset',
description: '説明文',
strategyId: 'xxx',
sourceId: 'keywords',
channelId: 'discover',
}

確認ポイント

presetId がユニーク

strategyId / sourceId / channelId が実在する

scheduledJobs では presetId を指定するのが最も安全

手順 4. Secret（本番必須）

OpenAI を使う strategy がある場合、
本番 Functions には Secret 設定が必須。

Secret を登録
firebase functions:secrets:set OPENAI_API_KEY

Functions 側での使い方（例）
import { defineSecret } from 'firebase-functions/params';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

process.env.OPENAI_API_KEY ||= OPENAI_API_KEY.value();

※ tick / runDue の定義に
secrets: [OPENAI_API_KEY] を必ず指定する。

手順 5. scheduledJobs を作成する（Firestore）
コレクション
scheduledJobs/{jobId}

最小構成（例）
{
enabled: true,
cron: "_/5 _ \* \* \*",
timeZone: "Asia/Tokyo",
engine: {
presetId: "my-preset"
},
nextRunAt: （今より過去の Timestamp）
}

重要（超重要）

初回実行には nextRunAt が必須

nextRunAt <= now の job だけが実行される

2回目以降は runJobOnce が自動更新する

手順 6. 動作確認（手動）
エンドポイント
runDue

例（本番）
curl https://<runDue-URL>

確認ポイント

{"ok": true, "due": 1} が返る

Firestore に以下が作成される

blogs

runs

scheduledJobs.nextRunAt が次回時刻に進む

自動実行（tick）

tick は 5分ごとに自動実行

scheduledJobs を確認し、due な job を実行

ログに [tick] due jobs: が出る

停止方法（重要）
一時停止（推奨）
enabled: true
↓
enabled: false

完全停止
firebase functions:delete tick

補足メモ

実行管理は Firestore（scheduledJobs） が持つ

strategy は「生成方法」だけを定義する

実行入口は

tick（定期）

runDue（手動）

Web 実行と scheduledJobs 実行は 別ルート

本番検証では runDue が最短ルート

## Strategy の設計ルール（重要）

- strategy パッケージは **export-only**（index.ts に副作用を書かない）
- `registerStrategy` は apps（functions / web）側で行う
- content-engine は strategy を直接 import しない
