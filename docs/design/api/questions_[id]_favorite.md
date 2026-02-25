# GET/POST /api/questions/{id}/favorite

## ソースファイル

`src/app/api/questions/[id]/favorite/route.ts`

## 概要

問題のお気に入り状態の取得・トグル操作を行う。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

---

### GET — お気に入り状態の取得

- **Path Parameter**: `id` — 問題ID
- **レスポンス**:

```json
{
  "isFavorite1": true,
  "isFavorite2": false,
  "isFavorite3": false,
  "isFavorite": true
}
```

---

### POST — お気に入りのトグル

- **Path Parameter**: `id` — 問題ID
- **Body**:

```json
{ "level": 1 }
```

- `level`: 1〜3 のいずれか
- **内部処理**: `toggleFavorite(questionId, userId, level)` で指定レベルの ON/OFF を切り替え

## 呼び出し元

- `FavoriteToggles.handleToggle()`
- `StudySessionScreen.fetchFavorites()`
