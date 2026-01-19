# 月次データ分析の方法

このドキュメントでは、  
`monthlyInsights/{YYYY-MM}` に保存されるデータの意味を説明します。

---

## monthlyInsights の役割

monthlyInsights は **判断材料のスナップショット**です。

- 再計算のためのデータではない
- 後から見返しても「その月どう考えたか」が分かる

---

## 基本データ

### docsCount

その月に生成された代表的な記事数。

- 多い = 活発
- 少ない = 実験中 or 抑制中

絶対値より **前月比** を見る。

---

### byStrategy / byChannel / bySource

どの strategy / channel / source が多く使われたか。

見るポイント：

- 偏りすぎていないか
- 意図した方向と合っているか

---

### topCombos

`strategy × source × channel` の組み合わせランキング。

- 「実際に強かったやり方」を知るための指標
- サンプルタイトルも参考にする

---

### topTopics

繰り返し扱われた topic。

- 偏りは悪ではない
- 収束しているなら、それは「強み」

---

## recommendations（最重要）

### 形式

```json
[
  { "presetId": "default", "score": 78, "why": [...] },
  { "presetId": "seo-push", "score": 64, "why": [...] },
  { "presetId": "gentle-rewrite", "score": 52, "why": [...] }
]
```
