# GET/PUT /api/settings/api-key

ユーザーのGemini APIキーをClerk privateMetadataで管理する。

## GET - APIキーの取得

### レスポンス

```json
{
  "hasApiKey": true,
  "maskedKey": "AIza...BNGY"
}
```

- APIキーが設定されている場合、先頭4文字+末尾4文字のマスク済みキーを返す
- 未設定の場合は `hasApiKey: false`

## PUT - APIキーの保存

### リクエスト

```json
{
  "apiKey": "AIzaSy..."
}
```

### レスポンス

```json
{
  "success": true
}
```

### バリデーション

- apiKey: string, "AIzaSy" で始まる必要あり

## 認証

- Clerk認証必須
- Clerk privateMetadata の `geminiApiKey` フィールドに保存
- DBには保存しない（セキュリティ上の理由）

## エラー

| ステータス | 条件 |
|:---|:---|
| 400 | バリデーションエラー |
| 401 | 未認証 |
| 500 | Clerk API呼び出し失敗 |