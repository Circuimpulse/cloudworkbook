# POST /api/ai/score

記述式問題の回答をGemini APIで自動採点する。

## リクエスト

```json
{
  "questionText": "問題文（Markdown）",
  "userAnswer": "ユーザーの回答（500字以内）",
  "correctAnswer": "模範解答",
  "explanation": "詳細正解データ（JSON文字列、optional）",
  "examType": "ap-gogo"
}
```

## バリデーション（Zod）

- questionText: string, 1〜10000字
- userAnswer: string, 1〜500字
- correctAnswer: string, 1〜5000字
- explanation: string, 5000字以内（optional）
- examType: string, 50字以内（optional）

## レスポンス

```json
{
  "score": 75,
  "isCorrect": false,
  "explanation": "## 採点結果\n\nキーワード「不可逆性」が不足しています..."
}
```

## 認証

- Clerk認証必須
- ユーザーのClerk privateMetadataからGemini APIキーを取得
- APIキー未設定時は400エラー

## エラー

| ステータス | 条件 |
|:---|:---|
| 400 | APIキー未設定 / バリデーションエラー |
| 401 | 未認証 |
| 500 | Gemini API呼び出し失敗 |