import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // スキーマファイルの場所
  schema: "./src/backend/db/schema.ts",

  // マイグレーションファイルの出力先
  out: "./drizzle",

  // SQLite方言（D1互換）
  dialect: "sqlite",

  // 開発環境ではローカルSQLite、本番ではTurso
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./local.db",
    ...(process.env.DATABASE_AUTH_TOKEN
      ? { authToken: process.env.DATABASE_AUTH_TOKEN }
      : {}),
  },

  // テーブル名の設定
  verbose: true,
  strict: true,
});
