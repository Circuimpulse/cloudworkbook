# LearningHistoryScreen

## 対象ソースファイル

`src/frontend/screens/LearningHistoryScreen.tsx`（476行）

## 責務・概要

学習履歴を3つのタブで閲覧できる画面。模擬テスト履歴・間違えた問題・お気に入り問題をそれぞれ一覧表示し、再挑戦への導線を提供する。

## Props

| Prop                 | 型                        | 必須 | 説明                                |
| -------------------- | ------------------------- | ---- | ----------------------------------- |
| `history`            | `MockTestHistory[]`       | ✅   | 模擬テスト履歴                      |
| `incorrectQuestions` | `IncorrectQuestionItem[]` | ✅   | 間違えた問題一覧                    |
| `favoriteQuestions`  | `FavoriteQuestionItem[]`  | ✅   | お気に入り問題一覧                  |
| `initialTab`         | `TabType`                 | —    | 初期表示タブ (default: `"history"`) |

## 型定義

| 型名                    | フィールド                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `IncorrectQuestionItem` | `progress`, `question: Question`, `section: Section`, `exam: Exam \| null`, `record` |
| `FavoriteQuestionItem`  | `record`, `question: Question`, `section: Section`, `exam: Exam \| null`             |
| `TabType`               | `"history" \| "incorrect" \| "favorites"`                                            |

## 画面構成

### タブ切り替え

URL クエリパラメータ `tab` と同期。ページリロード後も状態が維持される。

### 1. 履歴タブ (`history`)

- 模擬テスト結果を日付順に表示
- スコア（正解数/総問題数）、正答率%

### 2. 間違えた問題タブ (`incorrect`)

- 試験区分別にグルーピングして表示
- 各問題に `FavoriteToggles` を表示（その場でお気に入り操作可能）
- 「再挑戦」ボタン → `/sections/{sectionId}?mode=incorrect`

### 3. お気に入りタブ (`favorites`)

- 試験区分別にグルーピングして表示
- ⚙ 設定アイコン → `/settings/favorite`
- 「再挑戦」ボタン → `/sections/{sectionId}?mode=favorite`

## 主要関数

| 関数名                    | 説明                                 |
| ------------------------- | ------------------------------------ |
| `handleTabChange(newTab)` | タブ切り替え + URL更新               |
| `renderTabContent()`      | アクティブタブに応じたコンテンツ描画 |

## ルーティング

- **表示パス**: `/history`（`src/app/history/page.tsx`）
- **クエリパラメータ**: `tab` (タブ選択の永続化)
