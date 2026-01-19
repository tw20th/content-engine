```md
# 判断と反映の方法

このドキュメントは  
**「今月どうするか」を決めるための手順書**です。

---

## 判断するタイミング

- 月初に monthlyInsight が自動生成された後
- 作業時間が取れるときでOK

---

## 判断手順（これだけ）

### 1. Firestore を開く

monthlyInsights / YYYY-MM

yaml
コードをコピーする

---

### 2. recommendations を見る

- score が一番高い preset を確認
- why を軽く読む

---

### 3. preset を決める

基本ルール：

- 迷ったら score が高いもの
- 違和感があれば直感を優先

---

### 4. 判断を反映する（重要）

Firestore で次を編集：

contentEngineConfig / current
activePresetId = "default" | "seo-push" | "gentle-rewrite"

yaml
コードをコピーする

保存した瞬間から有効。

---

## よくある疑問

### コマンドは打たないの？

打たない。  
判断は **設定変更**。

---

### 間違えたら？

- 再度 `activePresetId` を変更すればOK
- 過去データには影響しない

---

## 運用ルール（おすすめ）

- 月に何度も切り替えない
- 切り替えたら runs の presetId を一度確認
- 数字より「納得感」を優先

---

## 次にやると良いこと（TODO）

- monthlyInsights を見やすくする UI
- Slack / Discord 通知
- recommendations のルール微調整
- 完全自動化（必要になったら）
```
