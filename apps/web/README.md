# content-engine (apps/web)

This app runs the **content-engine web interface & monthly pipeline**.

> 自分の代わりに、静かに試行錯誤し続けてくれる  
> 記事生成エンジンを動かすための Web / Script 実行環境です。

---

## What this app does

- 記事生成エンジン（strategy / source / channel）の実行
- 生成ログを Firestore に保存（`contentEngineRuns`）
- 月1での集計 → insight 下書き → 判断メモ保存（`monthlyInsights`）

「分析して正解を出す」ためではなく、  
**次に何を試すかを、疲れずに決める**ための仕組みです。

---

## Setup

### 1) Install

```bash
pnpm install
2) Environment variables
.env.local を作成してください
（.env.example をコピーするのが簡単です）。

bash
コードをコピーする
cp .env.example .env.local
必要な変数：

env
コードをコピーする
SAVE_TO_FIRESTORE=true

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
Firebase Admin SDK のサービスアカウントを使用します

FIREBASE_PRIVATE_KEY は 改行を \n のまま 記述してください
（コード側で復元します）

3) Run web (dev)
bash
コードをコピーする
pnpm --filter web dev
Open: http://localhost:3000

Monthly pipeline (recommended)
月1回だけ実行する、静かな改善ループです。

bash
コードをコピーする
pnpm --filter web exec node scripts/monthly-run.js 2026-01 --open
実行内容：

月次集計（strategy / source / channel 別）

report JSON を生成

insight 下書き JSON を生成

ファイルを手で編集（1〜2分）

Firestore に保存（monthlyInsights/YYYY-MM）

Firestore schema (minimum)
contentEngineRuns/{runKey}
記事生成の実行ログです。
同一日・同一組み合わせは 上書き されます。

topic: string

title: string

content: string

strategyId: string

sourceId: string

channelId: string

createdAt: string (ISO)

savedAt: string (ISO)

ymd: string (YYYY-MM-DD)

runKey: string

monthlyInsights/{YYYY-MM}
月1回の 判断メモ です。

month: string

summary.feeling: "quiet" | "neutral" | "noisy"

observations: string[]

decisions: string[]

experiments: string[]

stopDoing: string[]

notes: string

decidedAt: string (ISO)

分析は「正解を決める」ためではなく、
次に何を試すかを決めるためのもの。

Philosophy
がんばらせない

主張しない

静かに回り続ける

人が止まっても、仕組みは呼吸している

This app is designed to be portable.
You can move it to another project, or use it as the base of a SaaS.
```
