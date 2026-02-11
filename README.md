# 資格試験対策Webアプリケーション

Next.js + Cloudflare D1で構築する、効率的な学習を支援する資格試験対策アプリケーションです。

## 🎯 特徴

- **セクション学習**: 7問1セットの問題で効率的に学習
- **模擬テスト**: 全問題からランダム50問を出題し、本番さながらの演習
- **学習履歴管理**: セクションごとの進捗と模擬テスト履歴を記録
- **認証機能**: Clerkによる安全なユーザー認証

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI**

### バックエンド
- **Edge Runtime** (Cloudflare互換)
- **Drizzle ORM**
- **SQLite / Turso / Cloudflare D1**

### 認証
- **Clerk**

### デプロイ
- **フェーズ1**: Vercel（現在）
- **フェーズ2**: Cloudflare Pages + D1（将来）

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Clerkアカウント
- （オプション）Tursoアカウント

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd cloudworkbook
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集し、Clerkの認証情報を設定してください。

### 4. データベースのセットアップ

```bash
# マイグレーション実行
npm run db:generate
npm run db:migrate

# サンプルデータ投入
tsx scripts/seed.ts
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## 📁 プロジェクト構造

```
cloudworkbook/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート（Edge Runtime）
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # トップページ
├── components/            # Reactコンポーネント
│   └── ui/               # Shadcn/UIコンポーネント
├── lib/                   # ユーティリティ
│   ├── db/               # データベース関連
│   │   ├── schema.ts     # Drizzleスキーマ
│   │   ├── client.ts     # DB接続（移行対応）
│   │   └── queries.ts    # クエリ関数
│   └── utils.ts          # ユーティリティ関数
├── scripts/               # スクリプト
│   └── seed.ts           # サンプルデータ投入
├── drizzle/               # マイグレーションファイル
├── middleware.ts          # Clerk認証ミドルウェア
├── drizzle.config.ts      # Drizzle設定
└── next.config.ts         # Next.js設定
```

## 🗄️ データベース設計

### テーブル構成

- **users**: ユーザー情報
- **sections**: セクション（7問1セット）
- **questions**: 問題
- **section_progress**: セクション進捗（上書き更新）
- **mock_test_history**: 模擬テスト履歴（追記型）
- **mock_test_details**: 模擬テスト詳細

詳細は `lib/db/schema.ts` を参照してください。

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint

# データベース関連
npm run db:generate    # マイグレーション生成
npm run db:migrate     # マイグレーション実行
npm run db:studio      # Drizzle Studio起動
npm run db:push        # スキーマをDBにプッシュ
```

## 📦 デプロイ

### Vercelへのデプロイ

```bash
vercel
```

詳細は `SETUP.md` を参照してください。

### Cloudflare Pagesへの移行

将来的にCloudflare Pages + D1に移行する際の手順は `MIGRATION_TO_CLOUDFLARE.md` を参照してください。

## 🎨 デザインシステム

このプロジェクトは [Shadcn/UI](https://ui.shadcn.com/) を使用しています。

新しいコンポーネントの追加:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

## 🔐 認証

[Clerk](https://clerk.com/) を使用した最新のNext.js App Router対応認証を実装しています。

### セットアップ手順

1. [Clerk Dashboard](https://dashboard.clerk.com/last-active?path=api-keys) でAPI Keysを取得
2. `.env.local` に設定（`.env.example` を参照）
3. 開発サーバーを起動して、ヘッダーの「新規登録」ボタンからユーザー作成

### 認証ページ

- ログイン: `/sign-in`
- サインアップ: `/sign-up`
- ダッシュボード: `/dashboard`（認証必須）

### 実装詳細

- `middleware.ts`: `clerkMiddleware()` を使用した最新のミドルウェア
- `app/layout.tsx`: `<ClerkProvider>` でアプリ全体をラップ
- Clerkコンポーネント: `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>`

## 📝 ライセンス

MIT

## 🤝 コントリビューション

プルリクエストを歓迎します！

## 📞 サポート

問題が発生した場合は、Issueを作成してください。

## 🗺️ ロードマップ

- [x] プロジェクト初期構築
- [x] データベース設計
- [x] 認証実装
- [ ] ダッシュボードUI
- [ ] セクション学習機能
- [ ] 模擬テスト機能
- [ ] 学習履歴の可視化
- [ ] Cloudflare Pages移行

## 📚 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Clerk Documentation](https://clerk.com/docs)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Shadcn/UI](https://ui.shadcn.com/)
