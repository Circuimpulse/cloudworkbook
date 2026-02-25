# GET /api/exams/{id}/incorrect-questions

## ソースファイル

`src/app/api/exams/[id]/incorrect-questions/route.ts`

## 概要

指定した試験区分の間違えた問題をセクション別にグルーピングして返す。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`
- **Path Parameter**: `id` — 試験区分ID

## レスポンス

セクション別にグルーピングされた不正解問題の配列。

## 呼び出し元

- `IncorrectQuestionsScreen` (`mode="incorrect"`)
