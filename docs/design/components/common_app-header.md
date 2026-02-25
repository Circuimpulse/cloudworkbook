# AppHeader

## 対象ソースファイル

`src/frontend/components/common/app-header.tsx`

## 責務・概要

全ページ共通のヘッダーコンポーネント。Clerk認証UIを含み、ログイン状態に応じてナビゲーションを切り替える。`src/app/layout.tsx` で使用。

## Props

なし

## 表示内容

### 未ログイン時 (`SignedOut`)

- 左: Cloudアイコン + アプリ名（`/` へのリンク）
- 右: 「ログイン」ボタン（モーダル）、「新規登録」ボタン（モーダル）

### ログイン時 (`SignedIn`)

- 左: Cloudアイコン + アプリ名（`/` へのリンク）
- 右: 「ダッシュボード」リンク、`UserButton`（Clerk アバター + サインアウト）

## スタイル

- `border-b bg-white` で下線付き白背景
- コンテナ: `container mx-auto px-4 py-4 flex justify-between items-center`
