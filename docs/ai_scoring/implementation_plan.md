# Phase 3: AI採点機能 実装計画

## 概要
FP実技試験の記述式問題（fill_in, select, descriptive）において、
ユーザーの回答をGemini APIで採点し、スコアと解説を返す機能を実装する。

## アーキテクチャ

### 方針：クライアントサイドAPIキー管理
- ユーザー自身のGemini APIキーをlocalStorageに保存
- Next.js APIルート経由でGemini APIを呼び出し（APIキーはリクエストに含める）
- Vercelデプロイ時のコスト回避

### フロー
1. ユーザーが設定画面でGemini APIキーを入力
2. 記述式問題で回答提出後、「AI採点」ボタンが表示
3. ボタン押下でAPIルートにリクエスト送信
4. Gemini APIが採点結果をJSON返却
5. UIに採点結果（スコア＋解説）を表示

## 実装詳細

### 1. APIキー設定ページ
**[NEW] `src/app/settings/api-key/page.tsx`**
- APIキー入力フォーム（マスク表示）
- 保存ボタン（localStorageに保存）
- テスト送信ボタン（簡単なプロンプトでAPI疎通確認）
- トップ画面からのリンク追加

### 2. AI採点APIルート
**[NEW] `src/app/api/ai/score/route.ts`**
- POST: `{ apiKey, questionText, userAnswer, correctAnswer, correctAnswerDetail? }`
- Gemini API (`gemini-2.5-flash`) 呼び出し
- レスポンス: `{ score: number, explanation: string, isCorrect: boolean }`

### 3. 採点プロンプト
```
あなたはFP（ファイナンシャルプランナー）試験の採点官です。
以下の問題に対するユーザーの回答を採点してください。

【問題文】
{questionText}

【模範解答】
{correctAnswer}

【ユーザーの回答】
{userAnswer}

以下のJSON形式で回答してください:
{
  "score": 0〜100の数値,
  "isCorrect": true/false,
  "explanation": "採点理由の解説（日本語）"
}
```

### 4. StudySessionScreen統合
**[MODIFY] `src/frontend/screens/StudySessionScreen.tsx`**
- 記述式回答提出後に「AI採点」ボタンを表示
- ローディングスピナー表示
- 採点結果カード（スコアバッジ＋解説テキスト）
- APIキー未設定時は設定画面へのリンク表示

### 5. TopScreen更新
**[MODIFY] `src/frontend/screens/TopScreen.tsx`**
- 設定メニューにAPIキー設定リンクを追加

## 検証計画
1. APIキー設定画面でキー入力→保存→テスト送信
2. FP2級実技の記述式問題で回答→AI採点ボタン→採点結果表示
3. APIキー未設定時のフォールバック確認
4. 不正なAPIキーでのエラーハンドリング確認
