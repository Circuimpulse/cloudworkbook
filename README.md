# CloudWorkbook

IPA資格試験・FP技能検定の過去問演習Webアプリケーション。
スマホ1台で過去問演習が完結し、AI採点で記述式問題のフィードバックを提供。

## 特徴

- **14試験対応**: 応用情報(午前/午後)、FP3級/2級、IPA高度試験9区分
- **5つの問題形式**: 4択、○×、穴埋め、語群選択、自由記述
- **AI採点**: Gemini APIで記述式回答を自動採点・フィードバック
- **スマホファースト**: 横スクロール排除、文字サイズ最適化
- **お気に入り3段階**: 重要度別にブックマーク、OR/ANDフィルタで復習

## 技術スタック

| カテゴリ | 技術 |
|:---|:---|
| フレームワーク | Next.js 15 (App Router) / React 19 / TypeScript |
| スタイリング | Tailwind CSS / shadcn/ui |
| DB | Turso (LibSQL/SQLite) / Drizzle ORM |
| 認証 | Clerk |
| AI | Google Gemini API |
| バリデーション | Zod |
| テスト | Vitest (46テスト) |
| デプロイ | Vercel |

## クイックスタート

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集: Clerk, Turso の認証情報を設定

# 開発サーバー起動
npm run dev
```

http://localhost:3000 にアクセス

## 環境変数

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your_turso_token
```

## 開発コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # ビルド
npm run test         # テスト実行
npm run db:generate  # マイグレーション生成
npm run db:migrate   # マイグレーション実行
npm run db:studio    # Drizzle Studio
```

## データインポート

```bash
# 応用情報午前（CSV）
DATABASE_URL="file:./local.db" npx tsx scripts/import-ap-gozen.ts

# IPA午後（Markdown）
DATABASE_URL="file:./local.db" npx tsx scripts/import-ipa-gogo.ts

# FP（CSV/Markdown）
DATABASE_URL="file:./local.db" npx tsx scripts/import-csv.ts
```

## ドキュメント

- [要件定義書](docs/design/01_requirements.md)
- [基本設計書](docs/design/02_architecture.md)
- [Vercelデプロイガイド](docs/procedures/VERCEL_DEPLOYMENT.md)
- [API設計書](docs/design/api/)

## ライセンス

MIT