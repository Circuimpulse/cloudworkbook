# POST /api/user/progress/units

## ソースファイル

`src/app/api/user/progress/units/route.ts`

## 概要

セクション単位の進捗を保存・更新する。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `POST`
- **Body**:

```json
{
  "sectionId": 1,
  "correctCount": 5,
  "totalCount": 7
}
```

## 内部処理

`upsertSectionProgress(sectionId, userId, correctCount, totalCount)` で進捗を upsert。

## 呼び出し元

- `StudySessionScreen` — セクション完了時・リスト画面遷移時
