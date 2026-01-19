docs/how-to/new-functions-project.md

# New Functions Project（テンプレから立ち上げ）

この手順は、`@tw20th/content-engine/firebase` に runDue/runJob/tick を寄せた構成の
「最小 Functions テンプレ」を新プロジェクトにコピーして動かすための手順。

---

## 1. テンプレをコピー

新プロジェクト（例: `my-new-site`）に `apps/functions` をコピーする。

例（同一リポジトリ内で複製する場合）:

```bash
cp -R apps/functions apps/functions-mynew


※ 実運用では apps/functions をそのまま使い回すことが多いので、
「新規リポジトリに丸ごとコピー」でもOK。

2. functions の依存を入れる（必須）

新プロジェクトの functions に、content-engine と strategy を入れる。

pnpm -C apps/functions add \
  @tw20th/content-engine@latest \
  @tw20th/strategy-openai-basic@latest \
  @tw20th/strategy-quiet-rewrite@latest \
  @tw20th/strategy-quiet-spread@latest \
  @tw20th/strategy-rewrite-basic@latest \
  @tw20th/strategy-seo-basic@latest


版を固定したい場合は @latest を @0.0.xx に変える。

3. strategy 登録だけ編集する（ここが唯一の差分）

apps/functions/src/lib/registerStrategies.ts を編集する。

このプロジェクトで使う strategy だけ register する

使わない strategy は消してOK

例:

import { registerStrategy } from '@tw20th/content-engine';
import { openaiBasicStrategy } from '@tw20th/strategy-openai-basic';

export const registerAllStrategies = (): void => {
  registerStrategy(openaiBasicStrategy);
};

4. index.ts はテンプレ固定（原則いじらない）

apps/functions/src/index.ts は基本これでOK。

import { setGlobalOptions } from 'firebase-functions/v2';
import { registerAllStrategies } from './lib/registerStrategies.js';

setGlobalOptions({ region: 'asia-northeast1' });

registerAllStrategies();

export { tick, runDue, runJob } from '@tw20th/content-engine/firebase';

5. Firebase Emulator を起動（Firestore + Functions）

プロジェクトルートで:

firebase emulators:start --only functions,firestore --project <YOUR_PROJECT_ID>


例（flowerbox）:

firebase emulators:start --only functions,firestore --project flowerbox-a5f0a

6. scheduledJobs を 1件入れる（Firestore Emulator UI）

Firestore Emulator UI（例: http://127.0.0.1:4000/firestore）で

scheduledJobs にドキュメントを追加。

推奨フィールド:

nextRunAt (number): 0（すぐ発火させる）

strategyId (string): openai-basic（登録した strategyId）

payload (map):

topic (string): "テスト記事"

draft (string, optional)

sourceId (string, optional): "keywords"

channelId (string, optional): "discover"

例:

{
  "nextRunAt": 0,
  "strategyId": "openai-basic",
  "payload": {
    "topic": "テスト記事",
    "sourceId": "keywords",
    "channelId": "discover"
  }
}

7. 動作確認（runDue → runJob）
7-1. runDue（runs を queued で作る）
curl http://127.0.0.1:5001/<YOUR_PROJECT_ID>/asia-northeast1/runDue

7-2. runJob（queued を processing→success/error で終端）
curl http://127.0.0.1:5001/<YOUR_PROJECT_ID>/asia-northeast1/runJob

8. 正常系の期待結果（Firestore）
runs

status: "success" になっている

finishedAt が入っている

result.title が入っている

9. 失敗系の期待結果（止まらない）

strategyId を存在しない値にして runJob すると

status: "error"

finishedAt が入る

error に理由が入る

これにより "processingで止まる" が起きない。

10. よくあるハマり
"runJob が export されてない" と出る

VSCode の TS Server が古い型を掴んでることが多い

対処:

TypeScript: Restart TS Server

それでもダメなら VSCode 再起動

pnpm -C apps/functions list @tw20th/content-engine で版確認
```

11. 月次分析（Analytics）を有効にする（推奨）

このテンプレートでは、
生成結果を月次で集計し、次に使う preset を判断・反映する仕組みを組み込むことができる。

これは必須ではないが、
長期運用・改善を前提にする場合は強く推奨。

11-1. monthlyInsight（月次分析）を Functions に追加

apps/functions/src/schedules/monthlyInsight.ts を追加する。

役割：

月初に1回実行

先月分の runs / blogs を集計

Firestore に判断用データを保存

※ 実装例は docs/analytics/overview.md を参照。

11-2. index.ts に monthlyInsight を export

apps/functions/src/index.ts に以下を追加する。

export { monthlyInsight } from './schedules/monthlyInsight';

これで Firebase Functions としてデプロイ対象になる。

11-3. monthly モジュールを使えるようにする（package 側）

@tw20th/content-engine は CLI 用とは別に、
Functions から呼べる monthly APIを持っている。

使用箇所：

import { runMonthlyPipeline } from '@tw20th/content-engine/monthly';

これにより、

CLI

Functions

の両方から同じ分析ロジックを再利用できる。

12. 判断のしかた（運用ルール）
    12-1. 判断はコマンドではなく Firestore で行う

月次分析の結果は、以下に保存される。

monthlyInsights/{YYYY-MM}

中身には：

集計データ（数値）

observations（要約）

recommendations（preset 3択＋スコア）

が含まれる。

12-2. 判断を反映する方法（重要）

判断結果は、次の Firestore ドキュメントに反映する。

contentEngineConfig/current
activePresetId: string

例：

{
"activePresetId": "default"
}

この値を変更すると、
次回以降の job 実行時に自動で反映される。

12-3. preset の優先順位

実行時の preset は、次の順で決定される。

job に presetId が明示されている場合

contentEngineConfig/current.activePresetId

engine 側の default

そのため、

特定 job だけ別 preset

全体方針は monthlyInsight で判断

といった運用が可能。

13. 判断フローまとめ（超重要）

月次の判断フローは以下。

月初に monthlyInsight が自動実行される

Firestore の monthlyInsights/{YYYY-MM} を見る

recommendations（score）を確認

preset を1つ選ぶ

contentEngineConfig/current.activePresetId を変更

次回以降の job に自動反映

※ 判断時に CLI コマンドは不要。

14. 次作業するときにやると良いこと（TODO）

recommendations のスコアロジック微調整

monthlyInsights を Slack / Discord に通知

analytics 用の簡易管理画面作成

preset の追加・整理

完全自動化（人の判断を省くかどうかの検討）

※ いずれも今すぐやる必要はない。

補足：関連ドキュメント

docs/analytics/overview.md

docs/analytics/analysis.md

docs/analytics/decision.md

analytics フォルダ配下に、
考え方・読み方・判断方法をまとめている。

まとめ（この章の意図）

このテンプレは、

動かすだけの Functions

考えて改善できる Functions

の両方に対応している。

monthlyInsight + analytics を使うことで、
「とりあえず回す」から
「判断しながら育てる」 に移行できる。
