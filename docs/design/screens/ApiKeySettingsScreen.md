# ApiKeySettingsScreen

## 対象ソースファイル

`src/frontend/screens/ApiKeySettingsScreen.tsx`

## 責務・概要

ユーザーのGemini APIキーを設定・管理する画面。AI採点機能に必要なAPIキーをClerk privateMetadataに保存する。

## Props

なし（Client Component。Clerk認証から userId を取得）

## 画面構成

1. **説明セクション** — AI採点機能の説明、APIキー取得方法のリンク
2. **APIキー入力** — テキスト入力、マスク表示、保存ボタン
3. **現在の状態** — 設定済み/未設定の表示、マスク済みキー表示

## データフロー

- 取得: `GET /api/settings/api-key` → マスク済みキー表示
- 保存: `PUT /api/settings/api-key` → Clerk privateMetadataに保存

## ルーティング

- **表示パス**: `/settings/api-key`（`src/app/settings/api-key/page.tsx`）
- **アクセス元**: ヘッダーのAI採点設定リンク、AI採点時のAPIキー未設定メッセージ