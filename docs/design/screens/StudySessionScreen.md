# StudySessionScreen

## 対象ソースファイル

`src/frontend/screens/StudySessionScreen.tsx`（961行）

## 責務・概要

問題を1問ずつ解答するクイズ画面。4択形式の問題表示・解答・正誤判定・解説表示・お気に入り登録・進捗保存を行う。Markdown形式の問題文・選択肢・解説を `react-markdown` でリッチ表示する。

## Props

| Prop                    | 型                          | 必須 | 説明                 |
| ----------------------- | --------------------------- | ---- | -------------------- |
| `section`               | `Section`                   | ✅   | 現在のセクション     |
| `questions`             | `Question[]`                | ✅   | 出題する問題一覧     |
| `userId`                | `string`                    | ✅   | 認証済みユーザーID   |
| `initialQuestionNumber` | `number`                    | —    | 初期表示する問題番号 |
| `questionsProgress`     | `SectionQuestionProgress[]` | —    | 既存の解答進捗       |
| `progress`              | `any`                       | —    | セクション進捗情報   |
| `exam`                  | `Exam`                      | —    | 試験区分情報         |
| `prevSection`           | `Section \| null`           | —    | 前のセクション       |
| `nextSection`           | `Section \| null`           | —    | 次のセクション       |
| `mode`                  | `"incorrect" \| "favorite"` | —    | 再挑戦モード指定     |

## 画面構成

1. **プログレスバー** — 現在の問題番号 / 総問題数
2. **問題文** — Markdown形式 (`react-markdown` + `remark-gfm`)
3. **選択肢** (A〜D) — Markdown対応、クリックで選択
4. **解答確認ボタン** — 選択後にクリックで正誤判定
5. **正誤表示** — 正解/不正解のフィードバック + 解説テキスト
6. **お気に入りトグル** — `FavoriteToggles` コンポーネント (3段階)
7. **ナビゲーション** — 前の問題 / 次の問題 / リストへ戻る

## 主要関数

| 関数名                                              | 説明                               |
| --------------------------------------------------- | ---------------------------------- |
| `findFirstUnansweredIndex()`                        | 初期表示時に最初の未回答問題を検出 |
| `fetchFavorites()`                                  | 全問題のお気に入り状態をAPI取得    |
| `handleToggleFavorite(questionId, level)`           | お気に入りのトグル処理             |
| `handleAnswerSelect(answer)`                        | 解答選択時の処理                   |
| `handleSubmitAnswer()`                              | 解答確定・API送信・正誤判定        |
| `handlePreviousQuestion()` / `handleNextQuestion()` | 問題間の移動                       |
| `handleGoToList()`                                  | 進捗を保存して問題一覧画面へ遷移   |
| `renderOptionIndicator(optionKey)`                  | 選択肢の状態アイコン描画           |

## モード仕様

- **通常モード**: `questionsProgress` に基づき未回答問題から開始
- **`mode="incorrect"`**: 間違えた問題のみ出題。進捗無視で未回答状態から開始
- **`mode="favorite"`**: お気に入り問題のみ出題。同上
- 問題が0件の場合: 「対象の問題はありません」メッセージ + 戻るボタン

## ルーティング

- **表示パス**: `/sections/{id}`（`src/app/sections/[id]/page.tsx`）
