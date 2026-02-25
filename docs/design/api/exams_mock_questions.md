# GET /api/exams/mock/questions

## ソースファイル

`src/app/api/exams/mock/questions/route.ts`

## 概要

模擬試験用の問題をランダムに取得する。正解情報を含まない `PublicQuestion` を返す。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`
- **Query Parameters**:
  - `limit` — 取得問題数（デフォルト: 50）
  - `examId` — 試験区分ID（任意）

## レスポンス

```json
[
  {
    "id": 1,
    "sectionId": 1,
    "questionText": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "..."
  }
]
```

## 呼び出し元

- `MockExamScreen.fetchQuestions()`
