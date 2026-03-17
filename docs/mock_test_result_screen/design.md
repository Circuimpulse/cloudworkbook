# 学習履歴 examId 別分離 + 模擬試験結果の再表示

## 概要

学習履歴画面のデータを試験区分(examId)ごとに分離し、混在を解消する。
また、模擬試験の過去結果を学習履歴から再表示可能にする。

## 変更内容

---

### 1. DBスキーマ変更

#### [MODIFY] [schema.ts](file:///c:/Users/shugo/cloudworkbook/src/backend/db/schema.ts)

`mockTestHistory` テーブルに `examId` カラムを追加（NULL許容、既存データ互換）。

```diff
 export const mockTestHistory = sqliteTable("mock_test_history", {
   id: integer("id").primaryKey({ autoIncrement: true }),
   userId: text("user_id").notNull().references(() => users.id),
+  examId: integer("exam_id").references(() => exams.id),
   score: integer("score").notNull(),
   totalQuestions: integer("total_questions").notNull().default(50),
   takenAt: integer("taken_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
 });
```

#### [NEW] マイグレーションスクリプト (`scripts/add-exam-id-to-mock-test.ts`)

既存テーブルに `exam_id` カラムを追加する ALTER TABLE スクリプト。

---

### 2. バックエンド クエリ修正

#### [MODIFY] [queries.ts](file:///c:/Users/shugo/cloudworkbook/src/backend/db/queries.ts)

| 関数                       | 変更内容                                      |
| -------------------------- | --------------------------------------------- |
| `createMockTest`           | `examId` パラメータを追加して保存             |
| `getMockTestHistory`       | `examId` パラメータを追加してフィルタ         |
| `getAllIncorrectQuestions` | `examId` パラメータ（任意）を追加してフィルタ |
| `getAllFavoriteQuestions`  | `examId` パラメータ（任意）を追加してフィルタ |

---

### 3. 提出API修正

#### [MODIFY] [submission/route.ts](file:///c:/Users/shugo/cloudworkbook/src/app/api/exams/mock/submission/route.ts)

- リクエストボディに `examId` を追加
- `createMockTest` に `examId` を渡す

---

### 4. 模擬試験結果の再表示

#### [NEW] `/mock-test/result/[testId]/page.tsx`

- 過去の模擬試験結果をDBから取得して表示するルート
- `getMockTestHistory` + `getMockTestDetails` でデータ取得

#### [MODIFY] [MockTestResultScreen.tsx](file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/MockTestResultScreen.tsx)

- 2つのデータソースに対応:
  - **新規テスト**: `sessionStorage` から取得（現在の動作）
  - **過去の結果**: props として直接受け取る（学習履歴からの表示）

#### [NEW] 結果取得API (`/api/exams/mock/result/[testId]/route.ts`)

```
GET /api/exams/mock/result/[testId]
```

- `getMockTestDetails(testId)` でテスト詳細を取得
- `mockTestHistory` からスコア情報も取得

---

### 5. 学習履歴画面の改修

#### [MODIFY] [LearningHistoryScreen.tsx](file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/LearningHistoryScreen.tsx)

- Props に `exams: Exam[]` と `selectedExamId: number` を追加
- **試験区分セレクタ**（ドロップダウン）をヘッダーに追加
- 選択変更で `router.push(/history?examId={id}&tab={tab})` してサーバー再フェッチ
- 模擬試験結果カードをクリック → `/mock-test/result/{testId}` へ遷移

#### [MODIFY] [history/page.tsx](file:///c:/Users/shugo/cloudworkbook/src/app/history/page.tsx)

- `searchParams` から `examId` を取得
- デフォルトは最初の試験 (examId=1)
- 試験一覧 `getAllExams()` を取得して props に渡す
- 各データ取得関数に `examId` を渡す

---

### 6. MockExamScreen の修正

#### [MODIFY] [MockExamScreen.tsx](file:///c:/Users/shugo/cloudworkbook/src/frontend/screens/MockExamScreen.tsx)

- 提出時に `examId` もAPIに送信するよう修正

---

## ルーティング

```
/history?examId={id}&tab=history     ← 模擬試験結果（試験別）
/history?examId={id}&tab=incorrect   ← 間違えた問題（試験別）
/history?examId={id}&tab=favorite    ← お気に入り（試験別）

/mock-test/result                    ← 新規テスト結果（sessionStorage）
/mock-test/result/{testId}           ← 過去テスト結果（DB）
```

---

## 検証計画

1. `npm run build` でビルド確認
2. `/history?examId=1&tab=history` にアクセスして試験区分セレクタが表示されること
3. 試験区分を切り替えるとデータがフィルタされること
4. 模擬テスト実施→結果画面→「学習履歴へ」→ 結果が試験別に表示されること
5. 学習履歴の模擬試験結果カードをクリック→ `/mock-test/result/{testId}` で過去結果が表示されること
6. 過去結果画面でお気に入り一括登録が動作すること
