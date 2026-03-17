import fs from "fs";
import path from "path";
import { db } from "../src/backend/db/client";
import { exams, questions, sections } from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allExams = await db.select().from(exams);
  let totalMissing = 0;
  
  for (const exam of allExams.sort((a, b) => a.id - b.id)) {
    const secs = await db.select().from(sections).where(eq(sections.examId, exam.id));
    let examMissing = 0;
    const missingList: string[] = [];
    
    for (const s of secs) {
      const qs = await db.select().from(questions).where(eq(questions.sectionId, s.id));
      for (const q of qs) {
        const texts = [q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.explanation];
        for (const t of texts) {
          if (!t) continue;
          const imgMatches = [...t.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
          for (const m of imgMatches) {
            const imgPath = m[2];
            if (imgPath.startsWith("/images/kakomon/")) {
              const fullPath = path.join(process.cwd(), "public", imgPath);
              if (!fs.existsSync(fullPath)) {
                examMissing++;
                if (missingList.length < 5) missingList.push(`  qId=${q.id} ${q.sourceNote}: ${imgPath}`);
              }
            } else if (/\.(png|jpg)$/i.test(imgPath)) {
              examMissing++;
              if (missingList.length < 5) missingList.push(`  qId=${q.id} ${q.sourceNote}: [未変換] ${imgPath}`);
            }
          }
        }
      }
    }
    
    if (examMissing > 0) {
      console.log(`❌ ${exam.title}: ${examMissing}件不足`);
      missingList.forEach(l => console.log(l));
    } else if (secs.length > 0) {
      console.log(`✅ ${exam.title}: 画像OK`);
    }
    totalMissing += examMissing;
  }
  
  console.log(`\n合計不足: ${totalMissing}件`);
}

main().catch(console.error);
