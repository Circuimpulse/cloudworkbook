# questions/bulk-favorite API

## エンドポイント

`POST /api/questions/bulk-favorite`

## 説明

複数の問題を指定したお気に入りレベル(①②③の組み合わせ)で一括登録する。

## 認証

必須（Clerk）

## リクエスト

```json
{
  "questionIds": [1, 5, 12, 23],
  "levels": [1, 3]
}
```

| フィールド    | 型         | 必須 | 説明                                          |
| ------------- | ---------- | ---- | --------------------------------------------- |
| `questionIds` | `number[]` | ✅   | お気に入りに登録する問題IDの配列              |
| `levels`      | `number[]` | ✅   | お気に入りレベル (1, 2, 3 の任意の組み合わせ) |

## レスポンス

### 成功 (200)

```json
{
  "success": true,
  "count": 4,
  "levels": [1, 3]
}
```

### エラー

- `401`: 未認証
- `400`: `questionIds` または `levels` が不正
- `500`: サーバーエラー
