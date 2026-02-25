# POST /api/user/progress/questions

## ソースファイル

`src/app/api/user/progress/questions/route.ts`

## 概要

問題の解答結果を保存する。正誤情報と選択した解答をDBに記録し、セクション進捗も更新する。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `POST`
- **Body**:

```json
{
  "sectionId": 1,
  "questionId": 1,
  "isCorrect": true,
  "userAnswer": "A",
  "questionNumber": 1
}
```

## 内部処理

1. 問題ごとの進捗を upsert
2. セクション進捗を更新（正解数/出題数）

## 呼び出し元

- `StudySessionScreen.handleSubmitAnswer()`
