# フロントエンド HIG 準拠デザイン再設計

## 意図

[Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) に沿い、タップ領域・タイポグラフィ・ボタン階層・レスポンシブを統一した。

## 主な変更

### デザイントークン（`index.css`）

- システムフォントスタック（SF Pro 相当 + Noto Sans JP）
- セマンティックカラー（label / secondaryLabel / accent / fill / separator）
- 8pt グリッドのスペーシングスケール
- 角丸 10–12px（従来の太枠・ピル型から脱却）
- フォームコントロール最小高さ 44px

### コンポーネント

- `Button` — filled / tinted / gray / plain / destructive
- `FormField`, `SelectField`, `InputField`, `TextAreaField`, `InfoRow`
- `PageShell` — iOS 風グループドセクション、モバイルでは primary アクションを下に配置

### ページ

- HomePage, SettingsPage, PreSessionPage, EvaluationsPage, OverallReviewPage, EvaluationDetailPage, Reviewer* を新スタイルへ移行
- `SettingsPage` の `PageShell` タグ不整合、`PreSessionPage` の `useDeferredLoading` 未定義を修正

### 維持したもの

- `public/images/` の SVG イラスト（くま、ServiceName、機能アイコン等）
- ロールプレイ会議 UI（`zoom-*`）はダークテーマのまま、アクセント色のみ HIG 系に調整

## HIG 対応の具体例

| 項目 | 実装 |
|------|------|
| 最小タップ領域 44pt | `.btn`, `input/select`, `.disclosure__trigger` |
| ボタン階層 | 主要= filled、副次= gray/tinted、破壊的操作= destructive |
| モバイル CTA | `.page-actions` で `column-reverse`（主要ボタンが最下部） |
| タイポグラフィ | Large Title / Headline / Body / Footnote の CSS 変数 |
| アクセシビリティ | `:focus-visible`、`role="alert"`、`aria-expanded`（開閉） |
| モーション | `prefers-reduced-motion` でアニメーション無効化 |
