# Backend README

このディレクトリは、営業ヒアリングロープレAIサービスのバックエンド（FastAPI）を実装します。  
開発演習スコープでは、バックエンドはAmazon ECS Fargate上で常時ホストし、ALB経由でHTTPS / WSSを提供します。

## バックエンドの責務

- ドメイン・状態管理
  - Program / HearingSession / Evaluation / OverallReview の永続化
  - CustomerProfile（固定データ）とCustomerState（更新データ）の分離管理
  - プログラム/セッション状態遷移の整合性担保（異常終了時の破棄含む）
- 音声処理パイプライン
  - クライアント音声を受け取り、TranscribeでSTT
  - Bedrock（Claude）で顧客応答生成
  - PollyでTTSし、クライアントへ返却
  - セッション全体の録音と文字起こしをS3へ保存
- セッション終了時処理
  - 会話判定によりCustomerState更新（気づき度、ラポール度、開示済み情報、各回サマリ）
  - セッションタイトル自動生成
  - HULFT Square連携用ペイロード作成・トリガー送信
- 外部連携
  - HULFT Squareからの書き戻し用内部APIを提供（`X-API-Key`認証）
  - 書き戻しデータで評価ページ表示用情報をDB更新（冪等上書き）
  - 全回完了時の総評依頼フロー実行

## フロントエンドと共有すべき契約（共有事項）

- フロントは以下をバックエンドAPIの結果として表示する前提
  - 評価一覧（タイムスタンプ、セッションタイトル）
  - 評価詳細（複数評価者の評価）
  - 真の課題（全回完了時）+ 総評（先輩評価反映後）
- 真の課題は全回完了まで非表示とする仕様を、APIレスポンスでも担保する（先輩総評の完了は不要）
- セッション異常終了時は当該セッションを無効破棄し、再実施可能な状態を返す
- 先輩向け評価ページはUUID URLで保護し、推測困難性を維持する
- 機密情報（AWS認証情報、APIキー、Slackトークン等）は環境変数/Secrets Managerで管理し、コードへハードコードしない

## インフラ・実行前提

- アプリ: FastAPI + Uvicorn
- ホスティング: ECS Fargate（常時稼働）+ ALB（HTTPS / WSS）
- データ: PostgreSQL、S3
- AI/音声: Bedrock（Claude）、Transcribe、Polly
- 連携: HULFT Square（Slack通知 + 整形テキスト書き戻し）

## このREADMEを読むべきタイミング

- API・WebSocket・ドメインロジックを変更するとき
- セッション終了時処理、状態遷移、評価/総評反映ロジックを変更するとき
- HULFT Square内部APIや認証方式（APIキー）を変更するとき
- AWS構成（ECS/ALB/S3/Bedrock/Transcribe/Polly）を変更するとき