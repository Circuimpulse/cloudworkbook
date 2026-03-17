import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/backend/db/schema";
import { sql } from "drizzle-orm";

/**
 * ローカルSQLiteからTursoへデータを移行するスクリプト
 *
 * 使い方:
 *   DATABASE_URL=libsql://xxx DATABASE_AUTH_TOKEN=xxx npx tsx scripts/migrate-to-turso.ts
 */

const TURSO_URL = process.env.DATABASE_URL;
const TURSO_TOKEN = process.env.DATABASE_AUTH_TOKEN;
const LOCAL_DB = "file:./local.db";

if (!TURSO_URL || !TURSO_TOKEN || TURSO_URL.startsWith("file:")) {
  console.error("❌ DATABASE_URL (Turso) と DATABASE_AUTH_TOKEN を設定してください");
  process.exit(1);
}

async function main() {
  // ローカルDB接続
  const localClient = createClient({ url: LOCAL_DB });
  const localDb = drizzle(localClient, { schema });

  // Turso接続
  const tursoClient = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN });
  const tursoDb = drizzle(tursoClient, { schema });

  console.log("🚀 ローカルDB → Turso 移行開始\n");

  // 1. スキーマ作成（CREATE TABLE IF NOT EXISTS）
  console.log("📋 既存テーブル削除...");
  await tursoClient.execute("PRAGMA foreign_keys = OFF");
  // 全テーブル名を取得して削除
  const tablesResult = await tursoClient.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' AND name NOT LIKE 'libsql_%'");
  for (const row of tablesResult.rows) {
    await tursoClient.execute(`DROP TABLE IF EXISTS "${row.name}"`);
    console.log(`  dropped: ${row.name}`);
  }
  await tursoClient.execute("PRAGMA foreign_keys = ON");
  console.log("  ✅ 削除完了\n");

  console.log("📋 スキーマ作成...");
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS exams (
      id integer PRIMARY KEY AUTOINCREMENT,
      title text NOT NULL,
      description text,
      slug text UNIQUE,
      question_format text DEFAULT 'choice_only',
      created_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS exam_years (
      id integer PRIMARY KEY AUTOINCREMENT,
      exam_id integer NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      year integer NOT NULL,
      season text NOT NULL,
      label text,
      created_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS sections (
      id integer PRIMARY KEY AUTOINCREMENT,
      exam_id integer NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      "order" integer NOT NULL,
      created_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS section_progress (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL,
      section_id integer NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      correct_count integer DEFAULT 0 NOT NULL,
      incorrect_count integer DEFAULT 0 NOT NULL,
      last_studied_at integer,
      created_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id integer PRIMARY KEY AUTOINCREMENT,
      section_id integer NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      question_text text NOT NULL,
      question_type text NOT NULL DEFAULT 'choice',
      option_a text NOT NULL,
      option_b text NOT NULL,
      option_c text,
      option_d text,
      correct_answer text NOT NULL,
      correct_answer_detail text,
      explanation text,
      "order" integer NOT NULL,
      image_url text,
      category_id integer,
      exam_year_id integer,
      question_number integer,
      has_image integer DEFAULT 0 NOT NULL,
      source_note text,
      created_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS user_question_records (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL,
      question_id integer NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      is_correct integer NOT NULL,
      user_answer text,
      is_favorite integer DEFAULT 0,
      answered_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS user_favorite_settings (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL UNIQUE,
      include_favorites_in_study integer DEFAULT 0 NOT NULL,
      updated_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS ipa_categories (
      id integer PRIMARY KEY AUTOINCREMENT,
      name text NOT NULL,
      level integer NOT NULL,
      parent_id integer REFERENCES ipa_categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS mock_test_history (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL,
      exam_id integer NOT NULL REFERENCES exams(id),
      score integer NOT NULL,
      total_questions integer NOT NULL,
      time_spent integer,
      taken_at integer DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS mock_test_details (
      id integer PRIMARY KEY AUTOINCREMENT,
      test_id integer NOT NULL REFERENCES mock_test_history(id) ON DELETE CASCADE,
      question_id integer NOT NULL REFERENCES questions(id),
      user_answer text,
      is_correct integer NOT NULL
    )`,
  ];

  for (const stmt of createStatements) {
    await tursoClient.execute(stmt);
  }
  console.log("  ✅ テーブル作成完了\n");

  // 2. データ移行（テーブル順に依存関係を考慮）
  const tables = [
    { name: "exams", table: schema.exams },
    { name: "exam_years", table: schema.examYears },
    { name: "sections", table: schema.sections },
    { name: "questions", table: schema.questions },
    { name: "ipa_categories", table: schema.ipaCategories },
  ];

  for (const { name, table } of tables) {
    console.log(`📦 ${name} 移行中...`);

    // ローカルからデータ取得
    const rows = await localDb.select().from(table);
    if (rows.length === 0) {
      console.log(`  ⏭️ データなし、スキップ`);
      continue;
    }

    // 既存データクリア
    await tursoClient.execute(`DELETE FROM ${name}`);

    // バッチ挿入（100件ずつ）
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      for (const row of batch) {
        const cols = Object.keys(row as Record<string, unknown>);
        // camelCase → snake_case
        const snakeCols = cols.map(c => c.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`));
        const placeholders = cols.map(() => "?").join(", ");
        const values = cols.map(c => {
          const v = (row as Record<string, unknown>)[c];
          if (v === true) return 1;
          if (v === false) return 0;
          if (v instanceof Date) return Math.floor(v.getTime() / 1000);
          return v ?? null;
        });
        const colStr = snakeCols.map(c => c === "order" ? `"order"` : c).join(", ");
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO ${name} (${colStr}) VALUES (${placeholders})`,
          args: values as any,
        });
      }
      process.stdout.write(`  ${Math.min(i + batchSize, rows.length)}/${rows.length}\r`);
    }
    console.log(`  ✅ ${rows.length}件 完了`);
  }

  console.log("\n🎉 移行完了!");

  // 検証
  console.log("\n📊 Turso側のデータ確認:");
  for (const { name } of tables) {
    const result = await tursoClient.execute(`SELECT count(*) as c FROM ${name}`);
    console.log(`  ${name}: ${result.rows[0].c}件`);
  }
}

main().catch(e => { console.error("❌", e); process.exit(1); });
