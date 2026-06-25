# CI 通過手順（2026-06-24）

## CI の内容

ワークフロー: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

| 項目 | 内容 |
|------|------|
| トリガー | `main` / `master` への push、およびそれら向け PR |
| ランナー | `ubuntu-latest` |
| Node.js | 22 |
| パッケージマネージャ | **npm**（`npm ci`） |

### 実行ステップ

1. `npm ci` — `frontend/package-lock.json` から依存関係をインストール
2. `npm run format:check` — Prettier によるフォーマット検証
3. `npm run lint` — ESLint による静的解析

バックエンドの pytest や `npm run build` は **CI には含まれない**。

## ローカルで CI を再現する

### 方法 A: npm スクリプト（推奨）

```bash
cd frontend
npm ci
npm run ci
```

### 方法 B: シェルスクリプト

```bash
bash frontend/scripts/ci-check.sh
```

## 失敗時の対処

### 1. `npm ci` が失敗する

**原因**: `package.json` と `package-lock.json` の不整合。

**対処**:

```bash
cd frontend
npm install
git add package-lock.json
```

`package.json` だけ変更して lock ファイルを更新していないと CI で落ちる。

### 2. `format:check` が失敗する

**原因**: Prettier のルール（[`.prettierrc`](../frontend/.prettierrc)）に合っていない。

**対処**:

```bash
cd frontend
npm run format
git add -u
```

対象外ディレクトリは [`.prettierignore`](../frontend/.prettierignore) を参照（`dist`, `node_modules`, `.agents` など）。

### 3. `lint` が失敗する

**原因**: ESLint エラー（未使用変数、型まわり、React Hooks ルールなど）。

**対処**:

```bash
cd frontend
npm run lint
```

表示されたファイル・行を修正する。設定は [`eslint.config.js`](../frontend/eslint.config.js)。

## pnpm で開発している場合の注意

ローカル開発で `pnpm` を使っていても、**CI は npm 固定**。

依存関係を追加・更新したときは、必ず `package-lock.json` も更新すること。

```bash
cd frontend
# 例: pnpm で追加したあと
npm install
git add package.json package-lock.json
```

`pnpm-lock.yaml` だけ更新して `package-lock.json` を忘れると、ローカルでは動いても CI の `npm ci` で失敗する。

## PR 前チェックリスト

- [ ] `cd frontend && npm ci && npm run ci` が通る
- [ ] 依存関係を変えたら `package-lock.json` をコミットした
- [ ] 新規 `.ts` / `.tsx` / `.css` も Prettier 対象（`format:check` で確認）

## 現状（2026-06-24 時点）

`feat/design` ブランチの未コミット変更を含め、上記 CI コマンドはローカルで通過済み。

TypeScript ビルド確認は CI 外だが、マージ前の任意チェックとして有用:

```bash
cd frontend
npm run build
```
