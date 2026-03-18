# MockExamScreen

## 対象ソースファイル

`src/frontend/screens/MockExamScreen.tsx`

## 責務・概要

本試験形式の模擬試験画面。ランダムに出題された問題に解答する。リストボタンで問題一覧を確認でき、採点ボタンで任意のタイミングで採点して結果画面へ遷移する。

## Props

なし（Client Component。`examId` は URL クエリパラメータから取得）

## 型定義

| 型名             | フィールド                                              | 説明                     |
| ---------------- | ------------------------------------------------------- | ------------------------ |
| `PublicQuestion` | `id`, `sectionId`, `questionText`, `optionA`〜`optionD` | 正解を含まない問題データ |

## 画面フェーズ

### 1. 問題取得中 (`loading`)

- ローディングスピナー表示
- `GET /api/exams/mock/questions?examId={examId}` で問題取得

### 2. 出題中 (`ready`)

- 1問ずつ表示（問題番号 / 総数 + プログレスバー）
- RadioGroup による4択選択
- 「前の問題」「次の問題」ナビゲーション
- **リストボタン** → 問題リストモーダル（問題番号グリッド、解答済み/未回答の色分け、ジャンプ）
- **採点ボタン** → 未回答確認ダイアログ → 採点 → `/mock-test/result` へ遷移

### 3. 送信中 (`submitting`)

- `POST /api/exams/mock/submission` に全解答を送信
- 結果データを `sessionStorage` に保存し `/mock-test/result` へ遷移

## 主要関数

| 関数名                              | 説明                                           |
| ----------------------------------- | ---------------------------------------------- |
| `handleAnswerSelect(value)`         | 解答選択                                       |
| `handleNext()` / `handlePrevious()` | 問題間移動                                     |
| `handleScoreButtonClick()`          | 採点ボタン押下（未回答確認ダイアログ表示）     |
| `handleSubmit()`                    | テスト提出・sessionStorage保存・結果画面へ遷移 |
| `handleJumpToQuestion(index)`       | 問題リストモーダルからのジャンプ               |

## 使用コンポーネント

- `MockTestQuestionListModal` — 問題リストモーダル

## ルーティング

- **表示パス**: `/mock-test`（`src/app/mock-test/page.tsx`）
- **クエリパラメータ**: `examId` (試験区分の絞り込み)
- **遷移先**: `/mock-test/result`（採点後）
