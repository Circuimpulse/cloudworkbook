# ルーティング構造

## 画面遷移フロー

```
/ (TopScreen)
  ↓ 試験選択
/exams/[id] (SectionSelectScreen) ← AP午後は分野フィルタUI付き
  ↓ セクション選択
/sections/[id] (StudySessionScreen - 問題を解く)
  ↓ 「リスト」ボタンまたは完了
/sections/[id]/list (QuestionListScreen - 問題一覧)

/mock-test (MockExamScreen - 模擬試験)
  ↓ 採点
/mock-test/result (MockTestResultScreen - sessionStorage経由)
/mock-test/result/[testId] (MockTestResultScreen - DB経由)
```

## ルート一覧

### ページルート

| パス | コンポーネント | 認証 | 説明 |
|:---|:---|:---|:---|
| `/` | TopScreen | 不要 | トップページ - 試験一覧 |
| `/exams/[id]` | SectionSelectScreen | 必須 | セクション選択 + 分野フィルタ(AP午後) |
| `/sections/[id]` | StudySessionScreen | 必須 | 問題解答（5形式対応 + AI採点） |
| `/sections/[id]/list` | QuestionListScreen | 必須 | 問題一覧・正誤状況 |
| `/mock-test` | MockExamScreen | 必須 | 模擬試験（50問ランダム） |
| `/mock-test/result` | MockTestResultScreen | 必須 | 模擬試験結果（sessionStorage） |
| `/mock-test/result/[testId]` | MockTestResultScreen | 必須 | 模擬試験結果（DB） |
| `/history` | LearningHistoryScreen | 必須 | 学習履歴 |
| `/history/incorrect` | IncorrectQuestionsScreen | 必須 | 間違えた問題 |
| `/history/favorite` | IncorrectQuestionsScreen | 必須 | お気に入り問題 |
| `/settings/favorite` | FavoriteSettingsScreen | 必須 | お気に入り設定 |
| `/settings/api-key` | ApiKeySettingsScreen | 必須 | Gemini APIキー設定 |
| `/sign-in` | Clerk | 不要 | サインイン |
| `/sign-up` | Clerk | 不要 | サインアップ |

### APIルート

| メソッド | パス | 説明 |
|:---|:---|:---|
| POST | /api/ai/score | AI採点（Gemini API） |
| GET/PUT | /api/settings/api-key | Gemini APIキー管理 |
| GET/POST | /api/settings/favorite | お気に入りフィルター設定 |
| GET | /api/learning/units | セクション一覧+進捗 |
| POST | /api/learning/units/[id]/reset | セクション進捗リセット |
| POST | /api/user/progress/units | セクション進捗保存 |
| POST | /api/user/progress/questions | 個別問題の進捗保存 |
| GET/POST | /api/questions/[id]/favorite | お気に入り取得・トグル |
| POST | /api/questions/bulk-favorite | お気に入り一括取得 |
| GET | /api/exams/[id]/incorrect-questions | 間違えた問題一覧 |
| GET | /api/exams/[id]/favorite-questions | お気に入り問題一覧 |
| GET | /api/exams/mock/questions | 模擬テスト問題取得 |
| POST | /api/exams/mock/submission | 模擬テスト結果保存 |
| GET | /api/exams/mock/result/[testId] | 模擬テスト結果取得 |

## 認証

- middleware.ts で `/exams`, `/sections`, `/history`, `/settings`, `/mock-test` を保護
- 未認証ユーザーは `/sign-in` にリダイレクト