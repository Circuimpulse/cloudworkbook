import { db } from "../src/backend/db/client";
import { sections, questions, examYears } from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

/**
 * 午後試験データ（id=6〜15）をクリーンアップ
 */
async function main() {
  const examIds = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
  for (const examId of examIds) {
    const secs = await db.select().from(sections).where(eq(sections.examId, examId));
    for (const s of secs) {
      await db.delete(questions).where(eq(questions.sectionId, s.id));
    }
    await db.delete(sections).where(eq(sections.examId, examId));
    await db.delete(examYears).where(eq(examYears.examId, examId));
    console.log(`✅ id=${examId}: ${secs.length}セクション削除`);
  }
}

main().catch(console.error);
