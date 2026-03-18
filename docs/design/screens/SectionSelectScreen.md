# SectionSelectScreen

## 対象ソースファイル

`src/frontend/screens/SectionSelectScreen.tsx`

## 責務・概要

特定の試験区分に属するセクション一覧を表示し、学習セクションの選択・本試験モードの開始・学習履歴の確認への導線を提供する。

## Props

| Prop       | 型                                                                               | 必須 | 説明                               |
| ---------- | --- | ---- | --- |
| `sections` | `(Pick<Section, "id" \| "title" \| "order" \| "description"> & { examTitle?: string \| null })[]` | Yes | セクション一覧 |
| `exam`     | `Exam` | — | 試験区分情報 |

## 画面構成

1. **タイトルセクション** — `SectionHeader`（試験名 + 説明文）
2. **分野フィルタ** — AP午後(`slug === "ap-gogo"`)のみ表示。11分野のトグルボタン+全選択/全解除
3. **コースセクション** — `SectionsAccordion` で10セクション単位のアコーディオン表示（フィルタ適用後）
3. **本試験モード** — 「本試験モードを開始」ボタン → `/mock-test?examId={id}`
4. **学習履歴** — 「間違えた問題を見る」ボタン → `/history/incorrect?examId={id}`
5. **注記** — 補足テキスト

## 使用コンポーネント

- `SectionsAccordion` — セクション一覧アコーディオン
- `PageContainer`, `SectionHeader`, `SubSectionHeader` — 共通レイアウト
- `Button` — shadcn/ui

## ルーティング

- **表示パス**: `/exams/{id}`（`src/app/exams/[id]/page.tsx`）
- **遷移先**: `/sections/{sectionId}`, `/mock-test?examId={id}`, `/history/incorrect?examId={id}`

## 実装履歴

### セクション管理機能

- セクション番号を一意IDではなく試験区分ごとの `order` で表示
- 試験区分名 (`examTitle`) を各セクションに付与
- `getAllSectionsWithExams()` で試験区分情報を結合取得
- 模擬テストAPIに `examId` フィルタ追加
