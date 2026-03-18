# GET /api/learning/units

## ソースファイル

`src/app/api/learning/units/route.ts`

## 概要

全セクション一覧を試験区分情報付きで取得する。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

## リクエスト

- **Method**: `GET`

## 内部処理

`getAllSectionsWithExams()` を呼び出し、各セクションに所属する試験の `title` を結合して返す。

## レスポンス

```json
[
  {
    "id": 1,
    "examId": 5,
    "title": "#1",
    "description": "令和6年度 秋期 午後 問1 情報セキュリティ",
    "order": 1,
    "exam": {
      "id": 5,
      "title": "応用情報 午前",
      "slug": "ap-gozen"
    }
  }
]
```