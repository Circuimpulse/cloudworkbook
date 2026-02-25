# プロジェクト構成

このプロジェクトは、フロントエンドとバックエンドを明確に分離した構成になっています。

## ディレクトリ構成

```
cloudworkbook/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                # → TopScreenを呼び出し
│   │   ├── exams/[id]/page.tsx     # → SectionSelectScreenを呼び出し
│   │   ├── sections/[id]/
│   │   │   ├── page.tsx           # → StudySessionScreenを呼び出し
│   │   │   └── list/page.tsx      # → QuestionListScreenを呼び出し
│   │   ├── mock-test/
│   │   │   ├── page.tsx           # → MockExamScreenを呼び出し
│   │   │   └── result/page.tsx    # → MockTestResultScreenを呼び出し
│   │   ├── history/
│   │   │   ├── page.tsx           # → LearningHistoryScreenを呼び出し
│   │   │   ├── incorrect/page.tsx # → IncorrectQuestionsScreenを呼び出し
│   │   │   └── favorite/page.tsx  # → IncorrectQuestionsScreen(mode=favorite)
│   │   ├── settings/
│   │   │   └── favorite/page.tsx  # → FavoriteSettingsScreenを呼び出し
│   │   ├── sign-in/               # ログイン画面（Clerk提供）
│   │   ├── sign-up/               # サインアップ画面（Clerk提供）
│   │   ├── api/                    # APIルート
│   │   │   ├── exams/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── mock-test/
│   │   │   │   │   ├── incorrect-questions/
│   │   │   │   │   └── favorite-questions/
│   │   │   │   └── mock/
│   │   │   │       ├── questions/
│   │   │   │       └── submission/
│   │   │   ├── learning/
│   │   │   │   └── units/
│   │   │   │       └── [id]/reset/
│   │   │   ├── questions/
│   │   │   │   ├── [id]/favorite/
│   │   │   │   └── bulk-favorite/
│   │   │   ├── settings/favorite/
│   │   │   └── user/progress/
│   │   │       ├── questions/
│   │   │       └── units/
│   │   ├── layout.tsx             # ルートレイアウト（Clerk統合）
│   │   └── globals.css            # グローバルスタイル
│   │
│   ├── frontend/                    # フロントエンド（画面・コンポーネント）
│   │   ├── screens/                # 画面コンポーネント
│   │   │   ├── TopScreen.tsx
│   │   │   ├── SectionSelectScreen.tsx
│   │   │   ├── StudySessionScreen.tsx
│   │   │   ├── QuestionListScreen.tsx
│   │   │   ├── MockExamScreen.tsx
│   │   │   ├── MockTestResultScreen.tsx
│   │   │   ├── LearningHistoryScreen.tsx
│   │   │   ├── IncorrectQuestionsScreen.tsx
│   │   │   └── FavoriteSettingsScreen.tsx
│   │   ├── components/
│   │   │   ├── common/            # 共通コンポーネント
│   │   │   │   ├── page-container.tsx
│   │   │   │   ├── section-header.tsx
│   │   │   │   ├── app-header.tsx
│   │   │   │   └── FavoriteToggles.tsx
│   │   │   ├── features/          # 機能固有コンポーネント
│   │   │   │   └── sections-accordion.tsx
│   │   │   └── mock-test/         # 模擬テスト固有コンポーネント
│   │   │       └── MockTestQuestionListModal.tsx
│   │   ├── constants/
│   │   │   └── descriptions.ts    # 文言管理
│   │   ├── hooks/                  # カスタムフック
│   │   └── types/                  # 型定義
│   │
│   ├── backend/                     # バックエンド（DB）
│   │   └── db/
│   │       ├── client.ts          # DB接続
│   │       ├── queries.ts         # クエリ関数
│   │       ├── schema.ts          # スキーマ定義
│   │       └── index.ts           # 再エクスポート
│   │
│   └── components/                  # Shadcn/UI コンポーネント
│       └── ui/
│
├── docs/                            # ドキュメント
│   ├── design/                     # 設計書
│   │   ├── 01_requirements.md
│   │   ├── 02_architecture.md
│   │   ├── 03_database_design.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   ├── routing-structure.md
│   │   ├── screens/               # 画面設計書
│   │   ├── components/            # コンポーネント設計書
│   │   └── api/                   # API設計書
│   └── procedures/                 # 手順書（.gitignore対象）
│
├── scripts/                         # ユーティリティスクリプト
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## 画面ファイル一覧

| ファイル名                     | 説明                        | ルート                                    |
| ------------------------------ | --------------------------- | ----------------------------------------- |
| `TopScreen.tsx`                | トップページ（試験一覧）    | `/`                                       |
| `SectionSelectScreen.tsx`      | セクション選択画面          | `/exams/[id]`                             |
| `StudySessionScreen.tsx`       | クイズ画面（問題を解く）    | `/sections/[id]`                          |
| `QuestionListScreen.tsx`       | 問題一覧画面（進捗確認）    | `/sections/[id]/list`                     |
| `MockExamScreen.tsx`           | 模擬テスト出題画面          | `/mock-test`                              |
| `MockTestResultScreen.tsx`     | 模擬テスト結果画面          | `/mock-test/result`                       |
| `LearningHistoryScreen.tsx`    | 学習履歴画面                | `/history`                                |
| `IncorrectQuestionsScreen.tsx` | 間違えた/お気に入り問題画面 | `/history/incorrect`, `/history/favorite` |
| `FavoriteSettingsScreen.tsx`   | お気に入り設定画面          | `/settings/favorite`                      |

## 文言管理

すべての表示テキストは `frontend/constants/descriptions.ts` で一元管理されています。

```typescript
import { APP_TEXTS } from "@/frontend/constants/descriptions";

// 使用例
<h1>{APP_TEXTS.top.title}</h1>
```

## インポートパスエイリアス

`tsconfig.json` で以下のエイリアスが設定されています：

- `@/*` → `src/*`

### 使用例

```typescript
// フロントエンド
import TopScreen from "@/frontend/screens/TopScreen";

// バックエンド
import { getAllSections } from "@/backend/db/queries";
import type { Section } from "@/backend/db/schema";

// 共通コンポーネント
import { Button } from "@/components/ui/button";
```

## 開発ガイドライン

### 新しい画面を追加する場合

1. `src/frontend/screens/` に画面コンポーネントを作成
2. `src/app/` に対応するページを作成し、画面コンポーネントを呼び出し
3. 必要に応じて `src/frontend/constants/descriptions.ts` に文言を追加
4. データ取得が必要な場合は `src/backend/db/queries.ts` に関数を追加
5. `docs/design/screens/` に画面設計書を追加
6. `docs/design/routing-structure.md` にルートを追加

### 新しいコンポーネントを追加する場合

- 共通コンポーネント → `src/frontend/components/common/`
- 機能固有コンポーネント → `src/frontend/components/features/`
- UIコンポーネント（Shadcn/UI） → `src/components/ui/`

### APIルートを追加する場合

1. `src/app/api/` に新しいルートを作成
2. `src/backend/db/queries.ts` の関数を使用してデータ操作
3. `docs/design/api/` にAPI設計書を追加
