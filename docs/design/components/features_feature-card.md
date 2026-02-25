# FeatureCard

## 対象ソースファイル

`src/frontend/components/features/feature-card.tsx`

## 責務・概要

ダッシュボード用の機能カード。アイコン・タイトル・説明・アクションボタンを持つ。

## Props

| Prop          | 型                       | 必須 | デフォルト  | 説明             |
| ------------- | ------------------------ | ---- | ----------- | ---------------- |
| `icon`        | `LucideIcon`             | ✅   | —           | カードアイコン   |
| `title`       | `string`                 | ✅   | —           | カードタイトル   |
| `description` | `string`                 | ✅   | —           | 説明テキスト     |
| `href`        | `string`                 | ✅   | —           | 遷移先URL        |
| `actionText`  | `string`                 | ✅   | —           | ボタンテキスト   |
| `variant`     | `"default" \| "outline"` | —    | `"default"` | ボタンバリアント |

## 構成

- `Card` > `CardHeader`（アイコン + タイトル + 説明）> `CardFooter`（ボタン + ArrowRight）
- ホバー時: `shadow-lg` トランジション
