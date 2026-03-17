# Phase 3: AI採点機能 実装タスク

## 概要
FP2級実技の記述式問題に対して、Gemini APIを用いたAI採点機能を追加する。
ユーザーが自分のAPIキーを使ってクライアントサイドから直接Gemini APIを呼出し、
採点結果（スコア・解説）をリアルタイムに表示する。

## タスク一覧

### Step 1: APIキー設定画面
- [x] `/settings/api-key` ページ作成
- [x] Gemini APIキーの入力・保存UI（localStorage）
- [x] APIキーの有効性テスト機能

### Step 2: Gemini API連携（APIルート）
- [x] `/api/ai/score` APIルート作成
- [x] Gemini API呼び出しロジック
- [x] エラーハンドリング

### Step 3: 採点プロンプト設計
- [x] 採点用プロンプトテンプレート
- [x] JSONレスポンス解析

### Step 4: StudySessionScreen UI統合
- [x] 記述式回答後の「AI採点」ボタン追加
- [x] 採点結果の表示UI（スコア＋解説）
- [x] ローディング状態表示
