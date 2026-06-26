# Slack評価通知が届かない原因調査（2026-06-26）

## 結論

Slack通知が届かない原因は **複合** で、主因は次の2点。

1. **ECSタスク定義のSlack設定不足** — Bot Token未注入・スタブモードのまま・投稿先チャンネル未設定
2. **会話履歴が空のままセッション終了** — 実装仕様上、会話なし終了ではSlack評価通知は送らない

加えて HULFT Square 経由の通知も **403 Forbidden** で失敗している（別軸）。

## ECSタスク定義の現状（revision 22）

| 変数 | 状態 | 影響 |
|------|------|------|
| `SLACK_BOT_TOKEN` | **secrets に未設定** | `slack_client.py` がトークンなしと判断し送信スキップ |
| `SLACK_STUB_MODE` | **未設定（デフォルト `true`）** | トークンがあってもスタブ（ログのみ） |
| `SLACK_EVALUATION_CHANNELS` | **空文字** | 投稿先チャンネル未指定 |
| `SLACK_WEBHOOK_URL` | secrets にあるが **コード未使用** | 評価通知には効かない |

Secrets Manager には `syodan/slack`（Bot Token、59文字）が存在するが、タスク定義に紐付いていなかった。

## CloudWatchログの証拠

### Slack通知コードが一度も実行されていない

`/ecs/syodan` を `Slack` / `slack_client` / `SalesGym` / `stub evaluation` で検索 → **該当ログ0件**。

会話ありで `send_evaluation_request` が呼ばれれば、たとえスタブモードでも次のログが出る:

```
INFO:app.services.slack_client:Slack stub evaluation_request: 【SalesGym 評価依頼】...
```

このログが無い = **`conversation_log` が空のまま `finalize_session` された** 可能性が高い。

### 直近セッション終了の様子

例: セッション `7e2ceddb-...`（約2分間 WebSocket 接続後に終了）

- HULFT Webhook は呼ばれているが `403 Forbidden`
- Bedrock / AI ターン処理のログなし
- Slack 関連ログなし

→ ロープレ中に成功した会話ターン（PTT完了→STT→AI応答）が無かったと推定。

### 過去ログ（HULFTスタブ時代）

`HULFT stub session_complete` の payload で `"transcript": ""` が複数確認できる。

## 実装仕様との関係

[`session_finalize.py`](../backend/app/services/session_finalize.py):

```python
if conversation_log:
    await self.slack.send_evaluation_request(...)
```

会話なし終了（マイク未使用・STT失敗・発話検出なし等）では Slack 評価通知は **意図的に送らない**。

会話は ECS タスクの **in-memory バッファ**（[`sessions.py`](../backend/app/api/routes/sessions.py)）に蓄積される。現在 `desiredCount=1` のためタスク間不整合は起きにくいが、会話ターンが1回も完了していなければ空のまま。

## HULFT軸（参考）

直近ログ:

```
POST https://hsq-sales-trial.square.hulft.com/.../slack_app_api_noti "HTTP/1.1 403 Forbidden"
```

HULFT 側の認可・Webhook設定も要確認。Slack直接通知とは独立した問題。

## 対応手順

### 1. タスク定義を修正して再デプロイ

[`task-def-register.json`](../backend/scripts/task-def-register.json) に以下を追加済み:

- `SLACK_BOT_TOKEN` → `syodan/slack` secret（プレーン文字列のため ARN 末尾に `::` は付けない）
- `SLACK_STUB_MODE=false`
- `SLACK_EVALUATION_CHANNELS` → **投稿先チャンネル名を設定**（例: `#salesgym-evaluations`）

```powershell
# task-def-register.json の SLACK_EVALUATION_CHANNELS にチャンネル名を入れてから
powershell -ExecutionPolicy Bypass -File backend/scripts/aws/deploy.ps1
```

### 2. Slackアプリ設定

- 評価通知先チャンネルに Bot を招待
- `chat:write` スコープ必須
- `SLACK_EVALUATION_CHANNELS` にチャンネル名（`#` 付き）を設定

### 3. 動作確認

ロープレで **少なくとも1ターン会話**（PTTで発話→AI応答）してから「商談終了」する。

CloudWatch で次を確認:

- 成功時: `chat.postMessage` の httpx ログ、または投稿がチャンネルに現れる
- 会話なし終了: Slack ログは出ない（仕様どおり）
- 設定ミス時: `Slack evaluation notification failed` の exception ログ

### 4. HULFT 403 の解消（任意）

HULFT Square 側で Webhook の認可・IP制限・トークンを確認する。
