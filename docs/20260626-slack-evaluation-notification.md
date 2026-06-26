# Slack 評価・総評リンク通知（HULFT 並列軸）

## 意図

セッション終了時の先輩向け評価依頼を、HULFT Square に加えてバックエンドから Slack へ直接送る。HULFT は整形テキストの書き戻しと既存の iPaaS 通知を維持し、Slack 軸は通知のみを担当する。

## 責務分離

| 軸 | 役割 |
|----|------|
| HULFT Square | Webhook 受信 → Slack DM（既存）・整形テキスト書き戻し（`/internal/evaluation-artifacts`） |
| Slack 直接 | Bot Token + チャンネルへ評価入力 / 総評入力ページのリンクを投稿 |

書き戻し API は HULFT 専用のまま変更していない。

## トリガー条件

| イベント | 条件 | 送信メソッド | リンク先 |
|---------|------|-------------|---------|
| セッション評価依頼 | `conversation_log` が非空 | `SlackClient.send_evaluation_request` | `/reviewer/evaluations/{review_token}` |
| 総評依頼 | 全回完了（`completed_count >= total_sessions`） | `SlackClient.send_overall_review_request` | `/reviewer/overall-review/{overall_review_token}` |

会話なしで終了したセッションは Slack 評価通知を送らない。HULFT の `session_complete` は従来どおり全セッションで送る。

## 実装箇所

- [`backend/app/services/slack_client.py`](../backend/app/services/slack_client.py) — 評価・総評通知メソッド、共通 `_post_to_channels`
- [`backend/app/services/session_finalize.py`](../backend/app/services/session_finalize.py) — HULFT 呼び出し直後に並列で Slack 通知（失敗時はログのみ）

## 環境変数

| 変数 | 用途 | 例 |
|------|------|-----|
| `SLACK_BOT_TOKEN` | Bot Token（フィードバックと共用） | `xoxb-...` |
| `SLACK_EVALUATION_CHANNELS` | 評価・総評通知の投稿先 | `#salesgym-evaluations` |
| `SLACK_STUB_MODE` | `true` 時はログのみ | ローカル: `true`、本番: `false` |
| `FRONTEND_BASE_URL` | リンク URL のベース | `https://d3sqjmfezufvi4.cloudfront.net` |

`SLACK_EVALUATION_CHANNELS` 未設定時は、フィードバックと同様に Bot が参加しているチャンネル一覧へフォールバックする。本番では明示設定を推奨。

## 本番設定手順

1. Slack アプリを評価通知先チャンネルに招待する（`chat:write` スコープ必須）
2. ECS タスク定義の `SLACK_EVALUATION_CHANNELS` にチャンネル名を設定（例: `#先輩評価`）
3. `SLACK_BOT_TOKEN` と `SLACK_STUB_MODE=false` が設定済みであることを確認
4. HULFT Square も稼働中の場合、先輩へ二重通知になる可能性がある。DM は HULFT、チャンネルは Slack 直接、など役割を分ける

## メッセージ例

**評価依頼（第2回終了時）**

```
【SalesGym 評価依頼】第2回（金融）
目標: 予算感をヒアリング
https://example.com/reviewer/evaluations/abc123...
```

**総評依頼（全3回完了時）**

```
【SalesGym 総評依頼】金融（全3回完了）
https://example.com/reviewer/overall-review/xyz789...
```

## テスト

[`backend/tests/test_slack_evaluation_notify.py`](../backend/tests/test_slack_evaluation_notify.py)

- 会話あり → `send_evaluation_request` が1回呼ばれる
- 会話なし → 評価通知は呼ばれない
- 全回完了 → `send_overall_review_request` が1回呼ばれる
- `SLACK_STUB_MODE=true` → 例外なく完了
