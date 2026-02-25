# IncorrectQuestionsScreen

## 対象ソースファイル

`src/frontend/screens/IncorrectQuestionsScreen.tsx`（344行）

## 責務・概要

特定の試験区分における間違えた問題またはお気に入り問題をセクション別に表示する画面。`mode` パラメータにより「間違えた問題」と「お気に入り問題」の両方の表示に対応する共通画面。

## Props

| Prop     | 型                          | 必須 | 説明                                |
| -------- | --------------------------- | ---- | ----------------------------------- |
| `examId` | `number`                    | ✅   | 試験区分ID                          |
| `exam`   | `Exam`                      | ✅   | 試験区分情報                        |
| `mode`   | `"incorrect" \| "favorite"` | —    | 表示モード (default: `"incorrect"`) |

## 型定義

| 型名                   | フィールド                                  |
| ---------------------- | ------------------------------------------- |
| `SectionWithQuestions` | `section: Section`, `questions: Question[]` |

## 画面構成

1. **セクションヘッダー** — 「間違えた問題（試験名）」or「お気に入り問題（試験名）」
2. **ドロップダウン** — 間違えた問題 / お気に入り問題の切り替え
3. **セクション別アコーディオン** — 各セクションを折りたたみ表示
   - セクションタイトル + 問題数
   - 展開すると問題テキスト一覧
   - 「再挑戦」ボタン → `/sections/{sectionId}?mode={mode}`

## 主要関数

| 関数名                     | 説明                                                  |
| -------------------------- | ----------------------------------------------------- |
| `fetchData()`              | `GET /api/exams/{id}/{mode}-questions` からデータ取得 |
| `handleNavigation(value)`  | モード切り替え時のルーティング                        |
| `toggleSection(sectionId)` | セクションの折りたたみ制御                            |
| `renderContent()`          | コンテンツ描画                                        |

## データフロー

- `mode="incorrect"` → `GET /api/exams/{examId}/incorrect-questions`
- `mode="favorite"` → `GET /api/exams/{examId}/favorite-questions`

## ルーティング

- **表示パス**: `/history/incorrect?examId={id}` or `/history/favorite?examId={id}`
