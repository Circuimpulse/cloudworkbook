# GET /api/exams/mock/result/[testId]

保存済み模擬テスト結果を取得する。

## パスパラメータ

- `testId`: mock_test_history.id

## レスポンス

```json
{
  "testId": 42,
  "score": 38,
  "totalQuestions": 50,
  "takenAt": "2024-10-15T12:00:00Z",
  "examId": 5,
  "details": [
    {
      "questionId": 123,
      "userAnswer": "B",
      "isCorrect": false,
      "question": {
        "questionText": "...",
        "optionA": "...",
        "optionB": "...",
        "optionC": "...",
        "optionD": "...",
        "correctAnswer": "A",
        "explanation": "..."
      }
    }
  ]
}
```

## 認証

- Clerk認証必須
- 自分のテスト結果のみ取得可能

## エラー

| ステータス | 条件 |
|:---|:---|
| 401 | 未認証 |
| 404 | テスト結果が見つからない / 他ユーザーの結果 |