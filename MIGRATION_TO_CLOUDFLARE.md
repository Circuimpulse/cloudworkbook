# Cloudflare Pages + D1 移行ガイド

このプロジェクトは、Vercelでの素早いプロトタイプ構築を経て、Cloudflare Pages + D1への移行を想定して設計されています。

## 移行の準備状況

### ✅ 既に対応済み

1. **Edge Runtime使用**: すべてのAPIルートで `export const runtime = 'edge'` を設定
2. **SQLite互換クエリ**: D1でも動作するSQLite方言を使用
3. **Drizzle ORM**: データベース抽象化により、接続先の切り替えが容易
4. **モジュール化されたDB接続**: `lib/db/client.ts` で一元管理

### ⚠️ 移行時に調整が必要な箇所

1. **データベース接続**
2. **認証（Clerk）**
3. **画像最適化**
4. **環境変数**

## 移行手順

### 1. Cloudflare D1データベースの作成

```bash
# Wranglerのインストール
npm install -g wrangler

# Cloudflareにログイン
wrangler login

# D1データベースの作成
wrangler d1 create cloudworkbook

# 出力されたdatabase_idをメモ
```

### 2. wrangler.tomlの作成

```toml
name = "cloudworkbook"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "cloudworkbook"
database_id = "your-database-id-here"
```

### 3. データベース接続の変更

`lib/db/client.ts` を以下のように変更：

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Cloudflare D1用の接続関数
export function getDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
```

### 4. APIルートの変更

各APIルートで、環境変数からDBバインディングを取得するように変更：

**変更前（Vercel）:**

```typescript
import { db } from "@/lib/db/client";

export async function GET() {
  const sections = await getAllSections();
  return NextResponse.json({ sections });
}
```

**変更後（Cloudflare）:**

```typescript
import { getDb } from "@/lib/db/client";

export async function GET(request: Request, { env }: { env: { DB: D1Database } }) {
  const db = getDb(env);
  // queriesも引数でdbを受け取るように変更
  const sections = await getAllSections(db);
  return Response.json({ sections });
}
```

### 5. クエリ関数の変更

`lib/db/queries.ts` で、グローバルな `db` インスタンスではなく、引数で受け取るように変更：

```typescript
// 変更前
export async function getAllSections() {
  return db.select().from(sections).orderBy(sections.order).all();
}

// 変更後
export async function getAllSections(db: DbClient) {
  return db.select().from(sections).orderBy(sections.order).all();
}
```

### 6. マイグレーションの実行

```bash
# ローカルマイグレーション
wrangler d1 migrations create cloudworkbook initial

# マイグレーションファイルをdrizzleから手動コピー
# または、Drizzle Kitで生成したSQLをD1用に調整

# リモートマイグレーション実行
wrangler d1 migrations apply cloudworkbook --remote
```

### 7. 認証の調整

Clerkは基本的にそのまま動作しますが、以下を確認：

- Cloudflare PagesのドメインをClerkの許可リストに追加
- Webhookエンドポイントの更新

### 8. 画像最適化

Cloudflareには独自の画像最適化機能があります：

```typescript
// next.config.ts
export default {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
  },
};
```

### 9. デプロイ

```bash
# ビルド
npm run build

# Cloudflare Pagesにデプロイ
wrangler pages deploy .vercel/output/static
```

## 移行チェックリスト

- [ ] D1データベース作成
- [ ] wrangler.toml設定
- [ ] データベース接続コード変更
- [ ] 全APIルートの変更
- [ ] クエリ関数の引数変更
- [ ] マイグレーション実行
- [ ] 環境変数の設定
- [ ] Clerk設定の更新
- [ ] 画像最適化の調整
- [ ] テストデータの投入
- [ ] 動作確認
- [ ] 本番デプロイ

## コスト比較

### Vercel（現在）

- Hobby: 無料（制限あり）
- Pro: $20/月〜

### Cloudflare（移行後）

- Pages: 無料（月100,000リクエスト）
- D1: 無料（月500万読み取り、10万書き込み）
- 超過分も非常に安価

## パフォーマンス

Cloudflare Pagesは世界中のエッジロケーションで動作するため、
ユーザーに最も近いサーバーから配信され、レイテンシが大幅に改善されます。

## 注意事項

1. **D1の制限**: 現在ベータ版のため、本番運用には注意が必要
2. **ローカル開発**: `wrangler dev` でローカルD1を使用可能
3. **バックアップ**: D1のバックアップ戦略を検討
4. **モニタリング**: Cloudflareダッシュボードでメトリクスを監視

## サポート

移行で問題が発生した場合：

- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Community](https://community.cloudflare.com/)
- [Drizzle Discord](https://discord.gg/drizzle)
