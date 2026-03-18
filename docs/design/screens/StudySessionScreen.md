# StudySessionScreen

## 対象ソースファイル

`src/frontend/screens/StudySessionScreen.tsx`（約1,500行）

## 責務・概要

問題を1問ずつ解答するクイズ画面。5つの問題形式（4択・○×・穴埋め・語群選択・自由記述）に対応。
Markdown問題文のレンダリング、画像タップ拡大+Canvas書き込み、AI採点（Gemini API）、お気に入り3段階、XSS対策を統合。

## Props

| Prop | 型 | 必須 | 説明 |
|:---|:---|:---|:---|
| section | Section | Yes | 現在のセクション |
| questions | Question[] | Yes | 出題する問題一覧 |
| userId | string | Yes | 認証済みユーザーID |
| initialQuestionNumber | number | - | 初期表示する問題番号 |
| questionsProgress | SectionQuestionProgress[] | - | 既存の解答進捗 |
| progress | any | - | セクション進捗情報 |
| exam | Exam | - | 試験区分情報 |
| prevSection | Section \| null | - | 前のセクション |
| nextSection | Section \| null | - | 次のセクション |
| mode | "incorrect" \| "favorite" | - | 再挑戦モード指定 |

## 問題形式

| questionType | 説明 | 入力UI |
|:---|:---|:---|
| choice | 4択問題 | 選択肢タップで即時判定 |
| true_false | ○×問題 | ○/×タップで即時判定 |
| fill_in | 穴埋め（単一回答） | テキスト入力 + 「回答する」ボタン |
| select | 語群選択（複数空欄） | 空欄ごとのテキスト入力 |
| descriptive | 自由記述（IPA午後） | テキストエリア（500字制限）+ AI採点 |

## 画面構成

1. **プログレスバー** — 現在の問題番号/総数、正解数
2. **ヘッダー** — CloudWorkbookロゴ、試験名、出典情報、セクション間ナビ
3. **進捗インジケーター** — 各問題の正誤状態を色付きドットで表示
4. **出典情報 + お気に入り** — 出典メモの横にFavoriteToggles（3段階）を配置
5. **問題文** — MarkdownRenderer（画像タップ→ImageModal→DrawingCanvas）
6. **回答エリア** — 問題形式に応じたUI（上記参照）
7. **解説** — 正誤判定後にMarkdownで表示
8. **AI採点セクション** — 記述式のみ、スコアバー+フィードバック解説
9. **フッター** — 前/次ボタン、リストボタン

## AI採点フロー

1. 「回答してAI採点」→ `handleDescriptiveSubmit()` → `pendingAiScore=true`
2. useEffectで `showResult && pendingAiScore` を検出 → `handleAiScore()` 実行
3. POST `/api/ai/score` → Gemini API呼び出し
4. 結果: スコア(0-100)、正誤判定、解説をMarkdownで表示
5. APIキー未設定時: 設定画面へのリンクを表示

## XSS対策（記述式回答）

- HTMLタグ除去: `<[^>]*>`
- onイベント属性除去: `on\w+=`
- javascript:プロトコル除去
- 500字制限（フロント: maxLength + onChange制限、API: Zod max(500)）

## 主要関数

| 関数名 | 説明 |
|:---|:---|
| findFirstUnansweredIndex() | 初期表示時に最初の未回答問題を検出 |
| handleAiScore() | AI採点API呼び出し（コンポーネントレベル） |
| handleDescriptiveSubmit() | 記述式回答の提出・採点・DB保存 |
| handleAnswerSelect(answer) | 選択式の即時判定・DB保存 |
| handleToggleFavorite(id, level) | お気に入りトグル |
| handleGoToList() | 進捗保存→問題一覧画面へ |
| getCorrectAnswerDetail() | JSON形式の詳細正解データ取得 |

## 使用コンポーネント

- MarkdownRenderer — 問題文・解説のMarkdown表示、画像クリックでImageModal起動
- ImageModal — 画像拡大表示 + DrawingCanvasモード切替
- DrawingCanvas — Canvas上で赤い線を書き込み、Undo/消去/PNG保存
- FavoriteToggles — 3段階お気に入りボタン

## ルーティング

- **表示パス**: `/sections/{id}`（`src/app/sections/[id]/page.tsx`）