# GET/POST /api/settings/favorite

## ソースファイル

`src/app/api/settings/favorite/route.ts`

## 概要

ユーザーのお気に入り表示設定の取得・保存を行う。

## 認証

Clerk (`auth()`) — `userId` 必須。未認証時 `401`。

---

### GET — 設定の取得

- **レスポンス**:

```json
{
  "favorite1Enabled": true,
  "favorite2Enabled": true,
  "favorite3Enabled": true,
  "filterMode": "or"
}
```

---

### POST — 設定の保存

- **Body**:

```json
{
  "favorite1Enabled": true,
  "favorite2Enabled": false,
  "favorite3Enabled": true,
  "filterMode": "and"
}
```

- `filterMode`: `"or"` (いずれか) | `"and"` (すべて)

## 呼び出し元

- `FavoriteSettingsScreen.loadSettings()` / `handleSave()`
