# GET /api/learning/units

## ソースファイル

`src/app/api/learning/units/route.ts`

## 概要

全セクション一覧を取得する。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`

## 内部処理

`getAllSections()` を呼び出し。

## レスポンス

セクションの配列。
