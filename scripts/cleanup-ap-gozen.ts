import { db } from "../src/backend/db/client";
import { sections, questions, examYears } from "../src/backend/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * 応用情報午前のセクション・問題データをクリーンアップする
 * 再インポート前に実行する
 */
async function main() {
  const EXAM_ID = 5; // 応用情報 午前
  
  // 1. 問題を削除（セクション経由）
  const secs = await db.select().from(sections).where(eq(sections.examId, EXAM_ID));
  let deletedQ = 0;
  for (const s of secs) {
    const result = await db.delete(questions).where(eq(questions.sectionId, s.id));
    deletedQ++;
  }
  
  // 2. セクションを削除
  await db.delete(sections).where(eq(sections.examId, EXAM_ID));
  
  // 3. 年度情報を削除
  await db.delete(examYears).where(eq(examYears.examId, EXAM_ID));
  
  console.log(`✅ 応用情報午前(id=${EXAM_ID})のデータを削除しました`);
  console.log(`  セクション: ${secs.length}件 削除`);
  console.log(`  年度: 削除済み`);
}

main().catch(console.error);
