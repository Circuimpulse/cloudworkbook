# GET /api/exams/{id}/favorite-questions

## ソースファイル

`src/app/api/exams/[id]/favorite-questions/route.ts`

## 概要

指定した試験区分のお気に入り問題をセクション別にグルーピングして返す。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`
- **Path Parameter**: `id` — 試験区分ID

## レスポンス

```json
[
  {
    "section": { "id": 1, "title": "セクション#01", ... },
    "questions": [{ "id": 1, "questionText": "...", ... }]
  }
]
```

## 呼び出し元

- `IncorrectQuestionsScreen` (`mode="favorite"`)
