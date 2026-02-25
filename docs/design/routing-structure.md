# ルーティング構造

## 画面遷移フロー

```
/ (TopScreen)
  ↓ 試験選択
/exams/[id] (SectionSelectScreen)
  ↓ セクション選択
/sections/[id] (StudySessionScreen - 問題を解く)
  ↓ 「リスト」ボタンまたは完了
/sections/[id]/list (QuestionListScreen - 問題一覧)
  ↓ 問題をクリック
/sections/[id]?question=[n] (StudySessionScreen - 特定の問題に移動)
  ↓ 「戻る」ボタン
/exams/[id] (セクション一覧に戻る)
```

## ルート一覧

| パス                  | コンポーネント                             | 説明                                                            |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `/`                   | TopScreen                                  | トップページ - 試験一覧を表示                                   |
| `/exams/[id]`         | SectionSelectScreen                        | セクション選択 - 選択した試験のセクション一覧                   |
| `/sections/[id]`      | StudySessionScreen                         | 学習画面 - 問題を解く画面                                       |
| `/sections/[id]/list` | QuestionListScreen                         | 問題一覧 - 各問題の正誤状況を表示、特定の問題に飛べる           |
| `/history`            | LearningHistoryScreen                      | 学習履歴 - 過去の学習記録                                       |
| `/history/incorrect`  | IncorrectQuestionsScreen                   | 間違えた問題 - 試験区分別に間違えた問題を表示                   |
| `/history/favorite`   | IncorrectQuestionsScreen (mode="favorite") | お気に入り問題 - 試験区分別にお気に入り問題を表示               |
| `/mock-test`          | MockExamScreen                             | 模擬試験                                                        |
| `/mock-test/result`   | MockTestResultScreen                       | 模擬試験結果 - スコア表示、間違えた問題一覧、お気に入り一括登録 |
| `/settings/favorite`  | FavoriteSettingsScreen                     | お気に入り設定 - お気に入りレベルのON/OFFとフィルタモード設定   |
| `/sign-in`            | Clerk                                      | サインイン                                                      |
| `/sign-up`            | Clerk                                      | サインアップ                                                    |

## 削除されたルート

- ❌ `/list` - `/sections/[id]/list`に統合
- ❌ `/dashboard` - 削除済み（トップページ `/` に統合）

## 主要なナビゲーション

### TopScreen（/）

- 試験カードクリック → `/exams/[id]`

### SectionSelectScreen（/exams/[id]）

- セクションクリック → `/sections/[id]`
- API呼び出し: `/api/learning/units/[id]/reset` (POST) - 進捗リセット

### StudySessionScreen（/sections/[id]）

- 「リスト」ボタン → `/sections/[id]/list`（問題一覧へ）
- クイズ完了 → `/sections/[id]/list`（問題一覧へ）
- 前/次セクションボタン → `/sections/[id]`（隣接セクションへ）
- URLパラメータ: `?question=[n]` - 特定の問題番号から開始（1-indexed）
- API呼び出し: `/api/learning/sessions/progress` (POST) - 進捗保存

### QuestionListScreen（/sections/[id]/list）

- 問題番号クリック → `/sections/[id]?question=[n]`（その問題を開始）
- 「戻る」ボタン → `/sections/[id]?question=[n]`（最後に解いた問題に戻る）
- 前/次セクションボタン → `/sections/[id]/list`（隣接セクションの問題一覧へ）
- API呼び出し: `/api/learning/units/[id]/reset` (POST) - セクション切り替え時に進捗リセット

### IncorrectQuestionsScreen（/history/incorrect, /history/favorite）

- セクション別の間違えた問題/お気に入り問題を表示
- ドロップダウンで間違えた問題 ↔ お気に入り問題の切り替え
- 「再挑戦」ボタン → `/sections/[sectionId]?mode={mode}`
- クエリパラメータ: `examId` (試験区分の絞り込み)

### FavoriteSettingsScreen（/settings/favorite）

- お気に入りレベルのON/OFFとフィルタモード設定
- 保存後 `router.back()` で前画面に戻る

## API エンドポイント

### 学習関連

- `POST /api/learning/units/[id]/reset` - セクションの進捗をリセット
- `POST /api/learning/sessions/progress` - 学習セッションの進捗を保存

### 試験関連

- `GET /api/exams` - 試験一覧を取得（今後実装の可能性）
- `GET /api/exams/[id]` - 試験詳細を取得（今後実装の可能性）

## データベースクエリ

主要なクエリ関数（`backend/db/queries.ts`）:

- `getAllExams()` - 全試験を取得
- `getExamById(id)` - 試験を取得
- `getSectionsByExamId(examId)` - 試験のセクション一覧を取得
- `getSectionWithExam(sectionId)` - セクション情報（試験情報含む）を取得
- `getQuestionsBySection(sectionId)` - セクションの問題を取得
- `getSectionProgress(userId, sectionId)` - セクションの進捗を取得
- `getSectionQuestionsProgress(userId, sectionId)` - 問題ごとの進捗を取得

## 注意事項

1. **認証**: `/exams/*`, `/sections/*`, `/history/*`, `/mock-test`, `/settings/*`は認証が必要
2. **進捗リセット**: セクション開始時および切り替え時に進捗をリセットするAPI呼び出しを行う
3. **ナビゲーション**: すべてのナビゲーションは Next.js の `useRouter` を使用
4. **データフェッチ**: Server ComponentでDBクエリを実行（Next.js 15対応）
5. **問題一覧画面**: 各問題の正誤状況を視覚的に表示し、特定の問題に直接ジャンプ可能
