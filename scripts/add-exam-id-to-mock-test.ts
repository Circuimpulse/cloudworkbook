import { createClient } from "@libsql/client";
import path from "path";

/**
 * mockTestHistory テーブルに exam_id カラムを追加するマイグレーション
 */
async function main() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // ローカルDBをデフォルトで使用
    const absPath = path
      .resolve(process.cwd(), "local.db")
      .split(path.sep)
      .join("/");
    databaseUrl = `file:${absPath}`;
  }

  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log("Adding exam_id column to mock_test_history...");

  try {
    await client.execute(
      `ALTER TABLE mock_test_history ADD COLUMN exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL`,
    );
    console.log("✅ exam_id column added successfully.");
  } catch (error: any) {
    if (error.message?.includes("duplicate column name")) {
      console.log("ℹ️  exam_id column already exists, skipping.");
    } else {
      throw error;
    }
  }

  client.close();
}

main().catch(console.error);
