# QuestionListScreen

## 対象ソースファイル

`src/frontend/screens/QuestionListScreen.tsx`

## 責務・概要

セクション内の各問題の進捗状況（正解/不正解/未回答）を一覧表示する画面。セクション間の移動も可能。

## Props

| Prop                | 型                                      | 必須 | 説明                                            |
| ------------------- | --------------------------------------- | ---- | ----------------------------------------------- |
| `sections`          | `(Section & { exam?: Exam \| null })[]` | ✅   | 全セクション一覧（試験情報付き）                |
| `exam`              | `Exam \| null`                          | —    | 現在の試験区分                                  |
| `progressList`      | `SectionProgress[]`                     | ✅   | セクション単位の進捗                            |
| `questionsProgress` | `SectionQuestionProgress[]`             | ✅   | 問題単位の進捗                                  |
| `initialSectionId`  | `number`                                | —    | 初期表示するセクションID                        |
| `currentQuestions`  | `Question[]`                            | ✅   | 現在のセクションの問題一覧                      |
| `fromCompletion`    | `boolean`                               | —    | セクション完了後の遷移かどうか (default: false) |

## 画面構成

1. **ヘッダー** — セクションタイトル + 試験区分名
2. **進捗一覧** — 各問題を番号付きリストで表示。状態により色分け:
   - ✅ 正解 → 緑
   - ❌ 不正解 → 赤
   - ⬜ 未回答 → グレー
3. **ナビゲーションボタン** — 「前のセクション」「次のセクション」
4. **ダッシュボードへ戻る** ボタン

## 主要関数

- `handleQuestionClick(questionNumber)` — 問題番号クリック時の処理
- `handleBackToDashboard()` — ダッシュボードへの遷移

## ルーティング

- **表示パス**: `/sections/{id}/list`（`src/app/sections/[id]/list/page.tsx`）
