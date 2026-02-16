/**
 * お気に入り設定テーブルを追加するマイグレーション
 */

// 環境変数を設定
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./local.db";

import { db } from "../backend/db/client";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting migration: Adding favorite_settings table...");

  try {
    // favorite_settings テーブルを作成
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS favorite_settings (
        user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        favorite1_enabled INTEGER NOT NULL DEFAULT 1,
        favorite2_enabled INTEGER NOT NULL DEFAULT 1,
        favorite3_enabled INTEGER NOT NULL DEFAULT 1,
        filter_mode TEXT NOT NULL DEFAULT 'or' CHECK(filter_mode IN ('or', 'and')),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    console.log("✓ favorite_settings table created successfully");
    console.log("Migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log("All migrations completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

