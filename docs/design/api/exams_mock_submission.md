# POST /api/exams/mock/submission

## ソースファイル

`src/app/api/exams/mock/submission/route.ts`

## 概要

模擬試験の解答を提出し、採点結果を返す。テスト履歴と問題ごとの詳細をDBに保存する。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `POST`
- **Body**:

```json
{
  "answers": { "1": "A", "2": "C", ... },
  "examId": 1
}
```

## 内部処理

1. `answers` の各問題IDの正解を `questions` テーブルから取得
2. 採点（正解数算出）
3. `createMockTest()` でテスト履歴を作成
4. `insertMockTestDetails()` で問題ごとの詳細を保存

## レスポンス

```json
{
  "testId": 1,
  "score": 40,
  "totalQuestions": 50,
  "details": [
    {
      "questionId": 1,
      "userAnswer": "A",
      "isCorrect": true,
      "correctAnswer": "A",
      "question": { ... },
      "explanation": "..."
    }
  ]
}
```

## 呼び出し元

- `MockExamScreen.handleSubmit()`
