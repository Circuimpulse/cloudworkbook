# StatsCard

## 対象ソースファイル

`src/frontend/components/features/stats-card.tsx`

## 責務・概要

ダッシュボード用の統計表示カード。タイトル・数値・説明の3要素をシンプルに表示する。

## Props

| Prop          | 型                 | 必須 | 説明                                     |
| ------------- | ------------------ | ---- | ---------------------------------------- |
| `title`       | `string`           | ✅   | 統計ラベル（例: 「学習済みセクション」） |
| `value`       | `number \| string` | ✅   | 統計値                                   |
| `description` | `string`           | ✅   | 補足説明（例: 「達成率 80%」）           |

## 構成

- `Card` > `CardHeader`（タイトル: `text-sm text-muted-foreground`）> `CardContent`（数値: `text-3xl font-bold` + 説明: `text-xs text-muted-foreground`）
