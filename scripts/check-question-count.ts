/**
 * 問題数を確認するスクリプト
 */

// 環境変数を設定
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./local.db";

import { db } from "../backend/db/client";
import { questions, sections } from "../backend/db/schema";
import { eq, sql } from "drizzle-orm";

async function checkQuestionCount() {
  console.log("📊 Checking question counts...\n");

  // セクションごとの問題数
  const result = await db
    .select({
      sectionId: questions.sectionId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(questions)
    .groupBy(questions.sectionId)
    .all();

  // セクション情報を取得
  const allSections = await db.select().from(sections).all();

  console.log("Questions per section:");
  for (const section of allSections) {
    const count = result.find((r) => r.sectionId === section.id)?.count || 0;
    console.log(`   ${section.title}: ${count} questions`);
  }

  // 総問題数
  const total = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(questions)
    .get();

  console.log(`\n✅ Total questions: ${total?.count || 0}`);
}

checkQuestionCount()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

