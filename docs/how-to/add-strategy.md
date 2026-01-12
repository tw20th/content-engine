Add a Strategy（方法追加手順）

目的
新しい strategy を追加し、preset から選択でき、scheduledJobs によって自動実行できる状態にする。

────────────────────────────
手順 1. strategy パッケージを追加する
────────────────────────────

packages/strategy-xxx を作成する。

行うこと
・packages/strategy-xxx/src/xxx.ts を作成
・packages/strategy-xxx/src/index.ts で export する

確認ポイント
・strategyId が他と重複していない
・generate() が GeneratedArticle を返している

────────────────────────────
手順 2. contentEngineRegistry に登録する
────────────────────────────

ファイル
apps/web/lib/contentEngineRegistry.ts

行うこと
・registerStrategy(myStrategy) を追加

補足
ここは Web / Functions 共通で content-engine を初期化する場所。
strategy を「使える状態」にするために必須。

────────────────────────────
手順 3. preset を追加する（推奨）
────────────────────────────

ファイル
packages/content-engine/src/registry/presets.ts

行うこと
・ENGINE_PRESETS に preset を追加

確認ポイント
・strategyId / sourceId / channelId が正しい
・presetId がユニーク

補足
preset を作ることで
「strategy + source + channel」を
ひとまとまりの“実行設定”として扱える。

────────────────────────────
手順 4. scheduledJobs を作成する（Firestore）
────────────────────────────

コレクション
scheduledJobs/{jobId}

例
enabled: true
cron: 0 9 \* \* \*
timeZone: Asia/Tokyo
nextRunAt: 次回実行時刻
engine.presetId: xxx

確認ポイント
・nextRunAt と timeZone は root に置く
・engine.presetId が存在する preset を指している

────────────────────────────
手順 5. 動作確認
────────────────────────────

HTTP エンドポイント
runDue

例
curl -s "http://127.0.0.1:5001/
<projectId>/asia-northeast1/runDue"

確認ポイント
・due が 1 になる
・blogs が作成される
・runs が作成される
・scheduledJobs.nextRunAt が次の時刻に進む

────────────────────────────

補足メモ
・スケジュールの管理は Firestore（scheduledJobs）が持つ
・strategy 自体は「生成方法」だけを定義する
・実行入口は runDue に一本化する
・本番では Cloud Scheduler から runDue を叩く

────────────────────────────

もし次にやるなら
・scheduledJobs を作成する HTTP API を用意
・管理 UI から preset / cron を設定
・strategy に「おすすめ頻度」などのメタ情報を追加
