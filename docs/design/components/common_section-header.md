# SectionHeader / SubSectionHeader

## 対象ソースファイル

`src/frontend/components/common/section-header.tsx`

## 責務・概要

セクションの見出しを統一スタイルで描画するコンポーネント群。

---

## SectionHeader

メインの見出し + 区切り線 + サブタイトル。

| Prop        | 型       | 必須 | 説明           |
| ----------- | -------- | ---- | -------------- |
| `title`     | `string` | ✅   | メインタイトル |
| `subtitle`  | `string` | —    | サブタイトル   |
| `className` | `string` | —    | 追加CSSクラス  |

**スタイル**: `text-3xl font-normal md:text-[40px]` + `border-black/40` 区切り線

---

## SubSectionHeader

小さめのサブセクション見出し。

| Prop        | 型       | 必須 | 説明          |
| ----------- | -------- | ---- | ------------- |
| `title`     | `string` | ✅   | タイトル      |
| `className` | `string` | —    | 追加CSSクラス |

**スタイル**: `text-2xl font-normal md:text-[32px]`
