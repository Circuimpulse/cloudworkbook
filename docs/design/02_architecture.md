# 02. 基本設計書 (Architecture Design)

## 1. システムアーキテクチャ

CloudWorkbook は Next.js App Router を使ったフルスタック構成。フロントエンドとバックエンドを1つのVercelサーバーに同居させ、認知負荷と運用コストを最小化している。

### 1.1. 構成要素

- **Frontend / Backend**: Next.js 15 App Router
  - React 19 によるUI描画
  - API Routes（Edge Runtime）によるバックエンドロジック
  - Server Components による初期データ取得
- **Database**: Turso（LibSQL / SQLiteベース）
  - ORM: Drizzle ORM（型安全なTypeScript ORM）
  - ローカル開発: SQLiteファイル（local.db）
- **Authentication**: Clerk
  - middleware.tsで保護ルートを制御
  - privateMetadataにユーザーのGemini APIキーを保存
- **AI**: Google Gemini API
  - 記述式回答の自動採点（ユーザー所有のAPIキー）
  - PDF→Markdown変換（管理者用スクリプト）
- **Hosting**: Vercel

## 2. アーキテクチャ図

```
ユーザー (スマホ / PC)
    |
    v
Vercel Edge Network
    |
    +-- Next.js App Router
    |     +-- React 19 (Server Components + Client Components)
    |     +-- API Routes (/api/*)
    |     +-- middleware.ts (Clerk認証ゲート)
    |
    +-- Turso (LibSQL)  ←  Drizzle ORM
    |
    +-- Clerk Auth (認証・ユーザー管理)
    |
    +-- Gemini API (AI採点 / PDF変換)
```

## 3. ディレクトリ構成

```
cloudworkbook/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # APIエンドポイント
│   │   │   ├── ai/score/           # AI採点API
│   │   │   ├── exams/              # 試験関連API
│   │   │   ├── learning/units/     # セクション学習API
│   │   │   ├── questions/          # 問題・お気に入りAPI
│   │   │   ├── settings/           # 設定API（APIキー、お気に入りフィルタ）
│   │   │   └── user/progress/      # 進捗保存API
│   │   ├── exams/[id]/             # 試験選択・セクション一覧
│   │   ├── sections/[id]/          # セクション学習画面
│   │   ├── mock-test/              # 模擬テスト
│   │   ├── history/                # 学習履歴・間違い・お気に入り
│   │   ├── settings/               # APIキー設定等
│   │   ├── sign-in/                # Clerkログイン
│   │   ├── sign-up/                # Clerkサインアップ
│   │   ├── layout.tsx              # ルートレイアウト
│   │   └── page.tsx                # トップページ
│   ├── backend/
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle テーブル定義（12テーブル）
│   │   │   ├── client.ts           # DB接続（Turso / SQLite自動切替）
│   │   │   └── queries.ts          # クエリ関数（N+1排除済み）
│   │   ├── validations.ts          # Zodバリデーションスキーマ
│   │   ├── types.ts                # Clerk metadata型定義
│   │   └── __tests__/              # バックエンドテスト（46テスト）
│   ├── frontend/
│   │   ├── screens/                # 画面コンポーネント
│   │   │   ├── TopScreen.tsx       # トップ（コース選択）
│   │   │   ├── SectionSelectScreen.tsx  # セクション一覧
│   │   │   ├── StudySessionScreen.tsx   # 問題解答（選択式+記述式+AI採点）
│   │   │   ├── QuestionListScreen.tsx   # 進捗リスト
│   │   │   └── ApiKeySettingsScreen.tsx # APIキー設定
│   │   ├── components/
│   │   │   ├── common/             # 共通コンポーネント
│   │   │   │   ├── app-header.tsx
│   │   │   │   ├── MarkdownRenderer.tsx # Markdown/画像レンダラー
│   │   │   │   ├── FavoriteToggles.tsx  # お気に入り3段階ボタン
│   │   │   │   ├── DrawingCanvas.tsx    # Canvas書き込み
│   │   │   │   └── ImageModal.tsx       # 画像拡大モーダル
│   │   │   └── features/           # 機能固有コンポーネント
│   │   ├── constants/descriptions.ts  # UI文言定義
│   │   └── hooks/useQuizSession.ts    # クイズロジックhook
│   ├── middleware.ts               # Clerk認証（/exams, /history, /settings保護）
│   └── lib/utils.ts                # ユーティリティ
├── scripts/                        # 管理者用スクリプト
│   ├── import-ipa-gogo.ts          # IPA午後インポート（MD→DB）
│   ├── import-ap-gozen.ts          # 応用情報午前インポート（CSV→DB）
│   ├── import-csv.ts               # 汎用CSVインポート
│   ├── import-fp-md.ts             # FPインポート
│   └── migrate-to-turso.ts         # Turso移行
├── rawData/                        # 問題原本（git管理外）
│   ├── IPA_kakomon/                # IPA過去問PDF・MD・解説
│   └── FP/                         # FP過去問CSV
├── public/images/kakomon/          # 問題画像（年度別フォルダ）
├── docs/                           # 設計書
├── vitest.config.ts                # テスト設定
└── package.json
```

## 4. 技術スタック

| カテゴリ | 技術 | 備考 |
|:---|:---|:---|
| 言語 | TypeScript | フルスタック統一 |
| フレームワーク | Next.js 15 (App Router) | React 19 |
| スタイリング | Tailwind CSS | |
| UIライブラリ | shadcn/ui (Radix UI) | |
| アイコン | Lucide React | |
| ORM | Drizzle ORM | 型安全 |
| DB | Turso (LibSQL/SQLite) | ローカル: SQLite |
| 認証 | Clerk | privateMetadataでAPIキー管理 |
| AI | Google Gemini API | 採点・PDF変換 |
| バリデーション | Zod | API入力検証 |
| Markdown | react-markdown + remark-gfm | 問題文レンダリング |
| テスト | Vitest + Testing Library | 46テスト |
| デプロイ | Vercel | standalone output |

## 5. データベース設計

### 5.1. テーブル一覧（12テーブル）

| テーブル | 説明 |
|:---|:---|
| users | ユーザー（Clerk userId = PK） |
| ipa_categories | IPA公式3階層分類（大→中→小） |
| exams | 試験区分（応用情報午前、FP3級等） |
| exam_years | 試験年度・季節 |
| sections | セクション（試験区分ごとの章立て） |
| questions | 問題（5形式対応、画像・詳細正解JSON） |
| section_progress | セクション進捗（集計データ） |
| section_question_progress | 個別問題の正誤・回答記録 |
| user_question_records | お気に入り（3段階）・正誤履歴 |
| mock_test_history | 模擬テスト履歴 |
| mock_test_details | 模擬テスト各問の解答記録 |
| favorite_settings | お気に入りフィルター設定（OR/AND） |

### 5.2. インデックス

- sections_exam_id_idx
- questions_section_id_idx
- questions_exam_year_id_idx
- mock_test_history_user_id_idx
- mock_test_details_test_id_idx

## 6. API一覧

| メソッド | パス | 説明 |
|:---|:---|:---|
| POST | /api/ai/score | AI採点（Gemini API） |
| GET/PUT | /api/settings/api-key | Gemini APIキーの取得・保存 |
| GET/POST | /api/settings/favorite | お気に入りフィルター設定 |
| GET | /api/learning/units | セクション一覧+進捗 |
| POST | /api/learning/units/[id]/reset | セクション進捗リセット |
| POST | /api/user/progress/units | セクション進捗保存 |
| POST | /api/user/progress/questions | 個別問題の進捗保存 |
| GET/POST | /api/questions/[id]/favorite | お気に入り取得・トグル |
| POST | /api/questions/bulk-favorite | お気に入り一括取得 |
| GET | /api/exams/[id]/incorrect-questions | 間違えた問題一覧 |
| GET | /api/exams/[id]/favorite-questions | お気に入り問題一覧 |
| GET | /api/exams/mock/questions | 模擬テスト問題取得 |
| POST | /api/exams/mock/submission | 模擬テスト結果保存 |
| GET | /api/exams/mock/result/[testId] | 模擬テスト結果取得 |
