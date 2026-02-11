import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

/**
 * マイグレーション実行スクリプト
 * 
 * 使い方:
 * 1. npm run db:generate でマイグレーションファイル生成
 * 2. npm run db:migrate でマイグレーション実行
 */

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("🚀 Running migrations...");

  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("✅ Migrations completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed!");
  console.error(err);
  process.exit(1);
});
