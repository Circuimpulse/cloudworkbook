# GET /api/exams/{id}/mock-test

## ソースファイル

`src/app/api/exams/[id]/mock-test/route.ts`

## 概要

指定した試験区分からランダムに問題を取得する（本試験モード用）。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`
- **Path Parameter**: `id` — 試験区分ID

## 内部処理

`getRandomQuestions()` を呼び出し、指定試験区分の問題をランダムに取得。

## 呼び出し元

- `MockExamScreen`（試験区分指定の模擬テスト）
