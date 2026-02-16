# 実装計画: お気に入り機能の強化

## 前提条件

- データベース: SQLite (LibSQL)
- バックエンド: Next.js API Routes (Drizzle ORM)
- フロントエンド: React, Tailwind CSS

## 変更点

### 1. データベーススキーマ更新

`backend/db/schema.ts` の `userQuestionRecords` テーブルにカラムを追加します。

- `isFavorite1`: 整数 (`boolean`モード)
- `isFavorite2`: 整数 (`boolean`モード)
- `isFavorite3`: 整数 (`boolean`モード)

マイグレーションは SQL スクリプト (`scripts/add_favorite_columns.ts`) で実行します。

### 2. API / Backend Queries

- `backend/db/queries.ts`
  - `getFavoriteStatus`: 全てのお気に入りフラグを返すように拡張。
  - `toggleFavorite`: `level` 引数を追加し、指定されたレベルのフラグを更新。レガシー `isFavorite` も `level=1` と連動させる。
  - `getAllFavoriteQuestions`: 任意のレベルのお気に入りフラグが立っているデータを取得するように変更。

- `app/api/questions/[id]/favorite/route.ts`
  - POST リクエストで `level` パラメータを受け取るように変更。

### 3. Frontend Components

- `frontend/components/common/FavoriteToggles.tsx` (新規作成)
  - 3つのボタン（1, 2, 3）を表示し、クリックでお気に入りを切り替えるコンポーネント。
  - API呼び出しと状態更新を管理。

- `frontend/screens/StudySessionScreen.tsx`
  - 既存の単一お気に入りボタンを `FavoriteToggles` に置き換え。
  - 親の状態管理を更新。

- `frontend/screens/LearningHistoryScreen.tsx`
  - `FavoriteToggles` をインポートし、リスト内の各アイテムに配置。
  - `localFavoriteQuestions` ステートを導入し、リスト内での変更を即座に反映。
  - フィルタリング UI（チェックボックス、AND/OR ラジオボタン）を追加。
  - フィルタリングロジックを実装。

## 非機能要件

- 既存の `isFavorite` データは `isFavorite1` と互換性を持たせ、表示ロジックで考慮する。
- UIはユーザビリティを重視し、ワンクリックで切り替え可能にする。

## テスト項目

1. **新規登録**: クイズ画面でレベル1, 2, 3をそれぞれ登録できること。
2. **リスト表示**: 学習履歴画面のお気に入りに該当レベルの問題が表示されること。
3. **フィルタリング**:
   - レベル1のみチェック時、レベル1の問題のみ表示されること。
   - 複数チェック時、OR条件またはAND条件で正しく絞り込まれること。
4. **トグル**: リスト画面でお気に入りボタンをクリックし、状態が変更されること（APIが呼ばれ、UIが更新される）。
5. **リロード**: 画面リロード後も状態が保持されていること（DB永続化確認）。
