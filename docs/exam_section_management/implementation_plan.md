# 実装計画: 試験区分別問題管理と表示の最適化

## 目的

ユーザーが「応用情報試験：午前」や「Fp3級：午前」などの試験区分ごとに問題を適切に管理・実施できるようにする。特に、UI上で試験区分ごとの適切な番号付け（「#01」など）が行われるように修正する。

## 実装内容

### 1. セクション表示番号の変更（共通コンポーネント）

- **ファイル**: `frontend/components/features/sections-accordion.tsx`
- **目的**: グローバルな `id` ではなく、試験区分ごとの論理的な番号（`order`）を使用して表示する。
- **変更点**:
  - `SectionItem` インターフェースに `order` と `examTitle` を追加。
  - セクションタイトルの横に表示される番号を `#{pad2(section.id)}` から `#{pad2(section.order)}` へ変更。
  - セクションがどの試験区分に属するか（`examTitle`）があれば表示するように変更。

### 2. セクション一覧画面のデータ取得ロジック修正

- **ファイル**: `app/sections/page.tsx`
- **目的**: 全セクション一覧を表示する際に、試験区分情報をあわせて取得し、UIコンポーネントに渡す。
- **変更点**:
  - `getAllSections` を `getAllSectionsWithExams` に変更（インポート更新）。
  - `sections` 配列を作成する際に `examTitle` プロパティをマッピング。

### 3. スクリーンコンポーネントの型定義更新

- **ファイル**: `frontend/screens/section.tsx`
- **目的**: 上記のデータ構造の変更に対応するため、型定義を更新する。
- **変更点**:
  - `SectionScreenProps` の `sections` プロパティに `order` と `examTitle` を追加。

### 4. 模擬テストAPIの改善

- **ファイル**: `backend/db/queries.ts`, `app/api/mock-test/random/route.ts`
- **目的**: 特定の試験区分に絞った模擬テストを実施するための基盤作成。
- **変更点**:
  - `getRandomQuestions` クエリ関数に `examId` 引数を追加し、指定があれば絞り込むロジックを追加。
  - `/api/mock-test/random` エンドポイントが `examId` クエリパラメータを受け付けるように修正。

## 検証

- `/sections` ページにアクセスし、試験区分名と「#01」からの正しい番号が表示されるか確認する。
- `/exams/[id]` ページ（例：応用情報詳細）にアクセスし、「#01」からの正しい番号が表示されるか確認する。
- 模擬テストAPI (`/api/mock-test/random?examId=1`) が機能することを確認する（APIレスポンス確認）。
