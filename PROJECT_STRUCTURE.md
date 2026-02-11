# プロジェクト構成

このプロジェクトは、フロントエンドとバックエンドを明確に分離した構成になっています。

## ディレクトリ構成

```
cloudworkbook/
├── frontend/                     # フロントエンド（画面・コンポーネント）
│   ├── screens/                 # 画面コンポーネント
│   │   ├── top.tsx             # トップページ（最初に表示される画面）
│   │   ├── section.tsx         # セクション選択画面
│   │   ├── quizes.tsx          # クイズ画面（問題を解く）
│   │   ├── list.tsx            # 進捗リスト画面
│   │   └── dashboard.tsx       # ダッシュボード
│   ├── components/             # UIコンポーネント
│   │   ├── common/            # 共通コンポーネント
│   │   └── features/          # 機能固有コンポーネント
│   │       └── sections-accordion.tsx
│   ├── constants/              # 定数定義
│   │   └── descriptions.ts    # 文言管理（全画面の表示テキスト）
│   ├── hooks/                  # カスタムフック
│   └── types/                  # 型定義
│
├── backend/                     # バックエンド（API・DB）
│   ├── db/                     # データベース関連
│   │   ├── client.ts          # DB接続
│   │   ├── queries.ts         # クエリ関数
│   │   ├── schema.ts          # スキーマ定義
│   │   ├── migrate.ts         # マイグレーション実行
│   │   └── index.ts           # 再エクスポート
│   └── api/                    # API関連（将来の拡張用）
│
├── app/                         # Next.js App Router
│   ├── page.tsx                # → TopScreenを呼び出し
│   ├── sections/
│   │   ├── page.tsx           # → SectionScreenを呼び出し
│   │   └── [id]/
│   │       └── page.tsx       # → QuizesScreenを呼び出し
│   ├── list/
│   │   └── page.tsx           # → ListScreenを呼び出し
│   ├── dashboard/
│   │   └── page.tsx           # → DashboardScreenを呼び出し
│   ├── api/                    # APIルート
│   │   ├── sections/
│   │   │   ├── route.ts
│   │   │   └── progress/
│   │   │       └── route.ts
│   │   └── mock-test/
│   │       ├── random/
│   │       │   └── route.ts
│   │       └── submit/
│   │           └── route.ts
│   ├── layout.tsx             # ルートレイアウト（Clerk統合）
│   └── globals.css            # グローバルスタイル
│
├── components/                  # Shadcn/UI コンポーネント
│   └── ui/                     # 再利用可能なUIコンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       └── ...
│
├── scripts/                     # ユーティリティスクリプト
│   └── seed.ts                 # サンプルデータ投入
│
└── lib/                         # 共通ユーティリティ
    └── utils.ts                # ヘルパー関数
```

## 画面ファイル一覧

| ファイル名 | 説明 | ルート |
|-----------|------|--------|
| `top.tsx` | トップページ（最初に表示される画面） | `/` |
| `section.tsx` | セクション選択画面（問題を選べる） | `/sections` |
| `quizes.tsx` | クイズ画面（問題を解く） | `/sections/[id]` |
| `list.tsx` | 進捗リスト画面（7問中何問解いているか確認） | `/list` |
| `dashboard.tsx` | ダッシュボード | `/dashboard` |

## 文言管理

すべての表示テキストは `frontend/constants/descriptions.ts` で一元管理されています。

```typescript
import { APP_TEXTS } from "@/frontend/constants/descriptions";

// 使用例
<h1>{APP_TEXTS.dashboard.title}</h1>
<p>{APP_TEXTS.dashboard.description}</p>
```

### 文言カテゴリ

- `app`: アプリ共通（アプリ名など）
- `top`: トップページ
- `section`: セクション選択ページ
- `quizes`: クイズ画面
- `list`: 進捗リスト画面
- `dashboard`: ダッシュボード
- `auth`: 認証関連
- `actions`: 共通アクション
- `errors`: エラーメッセージ

## データフロー

```
[app/page.tsx] 
  ↓ データ取得なし
[frontend/screens/top.tsx]
  ↓ リンククリック
[app/sections/page.tsx]
  ↓ データ取得: getAllSections()
[frontend/screens/section.tsx]
  ↓ セクション選択
[app/sections/[id]/page.tsx]
  ↓ データ取得: getSectionById(), getQuestionsBySection()
[frontend/screens/quizes.tsx]
  ↓ 解答完了後、API POST: /api/sections/progress
[app/list/page.tsx]
  ↓ データ取得: getAllSections(), getAllSectionProgress()
[frontend/screens/list.tsx]
```

## インポートパスエイリアス

`tsconfig.json` で以下のエイリアスが設定されています：

- `@/*` - プロジェクトルート
- `@/frontend/*` - フロントエンドディレクトリ
- `@/backend/*` - バックエンドディレクトリ

### 使用例

```typescript
// フロントエンド
import TopScreen from "@/frontend/screens/top";
import { APP_TEXTS } from "@/frontend/constants/descriptions";

// バックエンド
import { getAllSections } from "@/backend/db/queries";
import type { Section } from "@/backend/db/schema";

// 共通コンポーネント
import { Button } from "@/components/ui/button";
```

## 追加画面・コンポーネント

プロジェクトには以下の追加コンポーネントも含まれています：

### フィーチャーコンポーネント

- `sections-accordion.tsx`: セクションを10件ごとに開閉表示するアコーディオン

### 認証画面

- `/sign-in`: ログイン画面（Clerk提供）
- `/sign-up`: サインアップ画面（Clerk提供）

### 将来の拡張

以下のディレクトリは将来の機能追加用に予約されています：

- `frontend/hooks/`: カスタムフック
- `frontend/types/`: 型定義ファイル
- `backend/api/`: API関連のロジック

## 開発ガイドライン

### 新しい画面を追加する場合

1. `frontend/screens/` に画面コンポーネントを作成
2. `app/` に対応するページを作成し、画面コンポーネントを呼び出し
3. 必要に応じて `frontend/constants/descriptions.ts` に文言を追加
4. データ取得が必要な場合は `backend/db/queries.ts` に関数を追加

### 新しいコンポーネントを追加する場合

- 共通コンポーネント → `frontend/components/common/`
- 機能固有コンポーネント → `frontend/components/features/`
- UIコンポーネント（Shadcn/UI） → `components/ui/`

### APIルートを追加する場合

1. `app/api/` に新しいルートを作成
2. `export const runtime = "edge"` を指定（Cloudflare互換）
3. `backend/db/queries.ts` の関数を使用してデータ操作

## Cloudflare移行準備

このプロジェクトは Cloudflare Pages + D1 への移行を見据えています：

- すべてのAPIルートは Edge Runtime を使用
- データベースアクセスは `backend/db/` で一元管理
- SQLite互換のクエリを使用

詳細は `MIGRATION_TO_CLOUDFLARE.md` を参照してください。
