# 評価送信失敗の修正（2026-06-26）

## 原因

1. **CloudFront の CustomErrorResponses** が API の 404 を `index.html`（200）に置き換えていた
   - フロントの `fetch` が HTML を JSON としてパースし失敗 →「評価の送信に失敗しました」
   - 検証: `GET /api/review/{invalid}` が CloudFront 経由で HTML を返していた

2. **CORS_ORIGINS が localhost のみ**
   - オリジン跨ぎアクセス時にプリフライトが拒否される可能性

3. **フロントが API エラー詳細を握りつぶしていた**
   - 実際の原因（例: `Session is not accepting evaluations`）が画面に出ない

## 対応

### バックエンド（デプロイ済み: task-def rev 25）

- レビュー API の「見つからない」を **404 → 400** に変更（CustomError の対象外）
- `CORS_ORIGINS` に本番ドメインを追加
- `FRONTEND_BASE_URL` を `https://sales-gym.org` に更新
- 評価受付ステータスに `completed` を追加

### フロントエンド

- `api.ts`: JSON パース失敗時に分かりやすいエラー
- 評価・総評ページ: API の `detail` メッセージをそのまま表示

### CloudFront（任意・推奨）

CustomErrorResponses を削除し SPA ルーター関数に移行する場合:

```powershell
powershell -ExecutionPolicy Bypass -File frontend/scripts/aws/apply-cloudfront-api-fix.ps1
```

バックエンドの 400 化だけでも API エラー時の HTML 化は解消済み。

## 確認

```bash
curl -s -w "\nHTTP:%{http_code}" "https://d3sqjmfezufvi4.cloudfront.net/api/review/00000000000000000000000000000000"
# {"detail":"Review page not found"}
# HTTP:400
```

ロープレ終了 → Slack の評価リンク → 1ターン以上会話後に「評価を送信」で動作確認。
