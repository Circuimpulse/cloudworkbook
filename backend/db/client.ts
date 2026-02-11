import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * データベースクライアントの作成
 * 
 * 【移行戦略】
 * - 開発/Vercel期: LibSQL (Turso) を使用
 * - Cloudflare移行後: drizzle-orm/d1 に差し替え
 * 
 * 移行時の変更箇所:
 * 1. import文を変更: drizzle-orm/libsql → drizzle-orm/d1
 * 2. createClient → env.DB (Cloudflare binding)
 * 3. DATABASE_URL → 不要（bindingを使用）
 */

// 環境変数チェック
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// LibSQLクライアントの作成
const client = createClient({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN, // Turso使用時のみ必要
});

// Drizzle ORMインスタンス
export const db = drizzle(client, { schema });

/**
 * 【Cloudflare D1移行時のコード例】
 * 
 * import { drizzle } from "drizzle-orm/d1";
 * 
 * export function getDb(env: { DB: D1Database }) {
 *   return drizzle(env.DB, { schema });
 * }
 * 
 * // API Routeでの使用例
 * export const runtime = 'edge';
 * 
 * export async function GET(request: Request, { env }: { env: { DB: D1Database } }) {
 *   const db = getDb(env);
 *   const users = await db.select().from(schema.users);
 *   return Response.json(users);
 * }
 */

export type DbClient = typeof db;
