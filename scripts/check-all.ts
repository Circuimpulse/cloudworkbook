import fs from "fs";
import path from "path";

// .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.substring(0, i).trim();
    const v = t.substring(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

import { db } from "../src/backend/db/client";
import { exams, examYears, questions, sections } from "../src/backend/db/schema";
import { eq, sql, and } from "drizzle-orm";

async function main() {
  const allExams = await db.select().from(exams).orderBy(exams.id);
  
  for (const exam of allExams) {
    console.log(`\n=== ${exam.title} (id=${exam.id}) ===`);
    
    const years = await db.select().from(examYears)
      .where(eq(examYears.examId, exam.id))
      .orderBy(examYears.year, examYears.season);
    
    let totalQ = 0;
    for (const year of years) {
      const [r] = await db.select({ count: sql`count(*)`.as("c") })
        .from(questions).where(eq(questions.examYearId, year.id));
      const qCount = Number(r.count);
      totalQ += qCount;
      
      const [noAns] = await db.select({ count: sql`count(*)`.as("c") })
        .from(questions)
        .where(and(
          eq(questions.examYearId, year.id),
          sql`(correct_answer IS NULL OR correct_answer = '')`
        ));
      
      const [hasImg] = await db.select({ count: sql`count(*)`.as("c") })
        .from(questions)
        .where(and(eq(questions.examYearId, year.id), eq(questions.hasImage, true)));
      
      const warns: string[] = [];
      if (Number(noAns.count) > 0) warns.push(`解答なし=${noAns.count}`);
      
      const warnStr = warns.length > 0 ? " ⚠️ " + warns.join(", ") : "";
      console.log(`  ${year.label}: ${qCount}問 (画像=${Number(hasImg.count)})${warnStr}`);
    }
    console.log(`  --- 合計: ${totalQ}問, ${years.length}年度`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
