# セットアップ手順

## 1. 依存関係のインストール

```bash
npm install
```

## 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定します。

```bash
cp .env.example .env
```

### Clerk認証の設定

1. [Clerk](https://clerk.com/) でアカウント作成
2. 新しいアプリケーションを作成
3. [API Keys ページ](https://dashboard.clerk.com/last-active?path=api-keys) を開く
4. **Publishable Key** と **Secret Key** をコピー
5. `.env.local` ファイルを作成して貼り付け

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**重要**: 
- `.env.local` は `.gitignore` に含まれており、Gitにコミットされません
- 本物のキーは絶対にコードやドキュメントに書かないでください

### データベースの設定

#### 開発環境（ローカルSQLite）

```env
DATABASE_URL=file:./local.db
```

#### 本番環境（Turso）

1. [Turso](https://turso.tech/) でアカウント作成
2. データベースを作成
3. 接続情報を `.env` に設定

```bash
turso db create cloudworkbook
turso db show cloudworkbook
turso db tokens create cloudworkbook
```

```env
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

## 3. データベースのマイグレーション

```bash
# マイグレーションファイル生成
npm run db:generate

# マイグレーション実行
npm run db:migrate
```

## 4. 初期データの投入（オプション）

問題データを投入するスクリプトを作成して実行します。

```bash
# 例: scripts/seed.ts を作成して実行
tsx scripts/seed.ts
```

## 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## 6. Vercelへのデプロイ

```bash
# Vercel CLIのインストール（初回のみ）
npm i -g vercel

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

### Vercelでの環境変数設定

Vercelダッシュボードで以下の環境変数を設定：

**Clerk認証**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - ClerkダッシュボードのAPI Keysからコピー
- `CLERK_SECRET_KEY` - ClerkダッシュボードのAPI Keysからコピー
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

**データベース**:
- `DATABASE_URL` - Turso接続URL
- `DATABASE_AUTH_TOKEN` - Tursoトークン（Turso使用時）

**注意**: Vercelにデプロイする前に、ClerkダッシュボードでVercelのドメインを許可リストに追加してください。

## 7. データベース管理

```bash
# Drizzle Studio（GUIでデータベース確認）
npm run db:studio
```

## トラブルシューティング

### マイグレーションエラー

```bash
# マイグレーションファイルを削除して再生成
rm -rf drizzle
npm run db:generate
npm run db:migrate
```

### Edge Runtimeエラー

Edge Runtimeでは一部のNode.js APIが使えません。
エラーが出た場合は、該当のAPIルートで `export const runtime = 'nodejs'` に変更してください。
（ただし、Cloudflare移行時に再度調整が必要）

## 次のステップ

- 問題データの投入
- ダッシュボードUIの実装
- セクション学習機能の実装
- 模擬テスト機能の実装
- 学習履歴の可視化
