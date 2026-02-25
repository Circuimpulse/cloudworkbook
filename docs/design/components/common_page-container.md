# PageContainer

## 対象ソースファイル

`src/frontend/components/common/page-container.tsx`

## 責務・概要

ページ共通のコンテナコンポーネント。最大幅・余白・背景色を統一し、レスポンシブ対応を提供する。

## Props

| Prop        | 型                | 必須 | デフォルト | 説明                                  |
| ----------- | ----------------- | ---- | ---------- | ------------------------------------- |
| `children`  | `React.ReactNode` | ✅   | —          | 子要素                                |
| `className` | `string`          | —    | —          | 追加CSSクラス                         |
| `fullWidth` | `boolean`         | —    | `false`    | `true` の場合 `max-w-[1440px]` を解除 |

## スタイル

- 外側: `min-h-[calc(100vh-73px)] bg-[#f5f5f5]`（ヘッダー高さ分を差し引いた最小高さ）
- 内側: `px-8 py-6 md:px-12 md:py-8`（レスポンシブパディング）
- `fullWidth=false` 時: `mx-auto max-w-[1440px]`
