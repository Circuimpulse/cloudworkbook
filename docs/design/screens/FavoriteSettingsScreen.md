# FavoriteSettingsScreen

## 対象ソースファイル

`src/frontend/screens/FavoriteSettingsScreen.tsx`（197行）

## 責務・概要

お気に入り問題の表示条件を設定する画面。3段階のお気に入りレベルのON/OFFと検索条件（OR/AND）を設定し、APIに保存する。

## Props

なし（Client Component。設定はAPIから読み込み）

## 型定義

| 型名               | フィールド                                                               | 説明                                                     |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `FavoriteSettings` | `favorite1Enabled`, `favorite2Enabled`, `favorite3Enabled`, `filterMode` | 各レベルの有効/無効 + フィルタモード (`"or"` \| `"and"`) |

## 画面構成

1. **ヘッダー** — 「お気に入り設定」 + 説明文
2. **戻るボタン** — `router.back()` で前画面へ
3. **トグルスイッチ** (3つ) — お気に入り①②③ の有効/無効切り替え（`Switch` コンポーネント）
4. **注意書き** — 有効化時の動作説明
5. **検索条件** — `RadioGroup` で OR / AND を選択
6. **保存ボタン** — 設定をAPIに送信

## データフロー

- **読み込み**: `GET /api/settings/favorite` → `FavoriteSettings`
- **保存**: `POST /api/settings/favorite` ← `FavoriteSettings`
- 保存成功後 `router.back()` で前画面に戻る

## ルーティング

- **表示パス**: `/settings/favorite`（`src/app/settings/favorite/page.tsx`）
