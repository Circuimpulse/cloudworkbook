# FavoriteToggles

## 対象ソースファイル

`src/frontend/components/common/FavoriteToggles.tsx`

## 責務・概要

問題に対する3段階のお気に入り登録ボタンを描画するコンポーネント。楽観的UI更新（Optimistic Update）を採用し、APIレスポンスを待たずにUIを即時更新する。

## Props

| Prop            | 型                                 | 必須 | デフォルト | 説明                     |
| --------------- | ---------------------------------- | ---- | ---------- | ------------------------ |
| `questionId`    | `number`                           | ✅   | —          | 対象の問題ID             |
| `initialStatus` | `FavoriteStatus`                   | ✅   | —          | 初期お気に入り状態       |
| `onUpdate`      | `(status: FavoriteStatus) => void` | —    | —          | 状態変更時のコールバック |
| `className`     | `string`                           | —    | —          | 追加CSSクラス            |
| `size`          | `"sm" \| "md"`                     | —    | `"md"`     | ボタンサイズ             |

## 型定義

```typescript
interface FavoriteStatus {
  isFavorite1: boolean;
  isFavorite2: boolean;
  isFavorite3: boolean;
  isFavorite?: boolean;
}
```

## ボタン仕様

| レベル | 色 (有効時)                 | 色 (無効時)             |
| ------ | --------------------------- | ----------------------- |
| ①      | 黄色 (`yellow-100/400/600`) | グレー (`gray-200/400`) |
| ②      | 赤色 (`red-100/400/600`)    | グレー                  |
| ③      | 青色 (`blue-100/400/600`)   | グレー                  |

## 動作フロー

1. ボタンクリック → UI即時更新（楽観的更新）
2. `POST /api/questions/{id}/favorite` に `{ level }` を送信
3. 成功 → サーバーのレスポンスでUIを確定
4. 失敗 → 元の状態に巻き戻し

## 使用箇所

- `StudySessionScreen` — クイズ解答時
- `LearningHistoryScreen` — 間違えた問題タブ
