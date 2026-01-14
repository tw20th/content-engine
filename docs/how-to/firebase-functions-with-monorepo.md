# Firebase Functions × Monorepo 注意点

## 結論

Firebase Functions（Gen2 / Cloud Run）は `workspace:*` を理解しない。

## やってはいけないこと

- apps/functions/package.json に `workspace:*` を残す
- Functions 実行時に @tw20th/\* を require させる

## 正解パターン

- @tw20th/\* は **root package.json の devDependencies**
- apps/functions は **esbuild で完全にバンドル**
- 出力された `lib/index.js` に @tw20th/\* が残っていないことを確認

```sh
grep -R "@tw20th/" apps/functions/lib/index.js
# => no @tw20th imports
```
