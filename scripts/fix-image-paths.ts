import fs from "fs";
import path from "path";

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
import { questions, sections, examYears, exams } from "../src/backend/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  let fixCount = 0;

  // Build a mapping: examYearId -> slug for image path conversion
  const allExams = await db.select().from(exams);
  const allYears = await db.select().from(examYears);

  const slugMap: Record<number, string> = {};
  for (const e of allExams) {
    slugMap[e.id] = e.slug || e.title;
  }

  // examYearId -> folder name for images
  const yearFolderMap: Record<number, string> = {};
  for (const y of allYears) {
    const slug = slugMap[y.examId] || "unknown";
    const seasonStr = y.season === "spring" || y.season === "jan" ? "01"
      : y.season === "may" ? "05"
      : y.season === "sep" ? "09"
      : y.season === "autumn" ? "aki" : y.season;
    // FP exams use YYYYMM format, IPA exams use different format
    if (slug.startsWith("fp")) {
      const monthMap: Record<string, string> = { jan: "01", may: "05", sep: "09" };
      yearFolderMap[y.id] = `${slug}_${y.year}${monthMap[y.season] || "00"}`;
    }
  }

  // Get all questions
  const allQ = await db.select().from(questions);

  for (const q of allQ) {
    const folder = yearFolderMap[q.examYearId || 0];
    if (!folder) continue;

    const fields: { key: string; value: string | null }[] = [
      { key: "questionText", value: q.questionText },
      { key: "optionA", value: q.optionA },
      { key: "optionB", value: q.optionB },
      { key: "optionC", value: q.optionC },
      { key: "optionD", value: q.optionD },
      { key: "explanation", value: q.explanation },
    ];

    const updates: Record<string, string | null> = {};
    let changed = false;

    for (const { key, value } of fields) {
      if (!value) continue;
      // Fix bare image refs: (問題NN.png) → (/images/kakomon/FOLDER/問題NN.png)
      const regex = /!\[([^\]]*)\]\((問題[^/)][^)]*\.png)\)/g;
      if (regex.test(value)) {
        const fixed = value.replace(/!\[([^\]]*)\]\((問題[^/)][^)]*\.png)\)/g,
          `![$1](/images/kakomon/${folder}/$2)`);
        updates[key] = fixed;
        changed = true;
      }
    }

    if (changed) {
      await db.update(questions).set(updates as any).where(eq(questions.id, q.id));
      fixCount++;
      console.log(`Fixed qId=${q.id} (${q.sourceNote}): ${Object.keys(updates).join(", ")}`);
    }
  }

  console.log(`\nTotal fixes: ${fixCount}`);
}

main().catch(e => { console.error(e); process.exit(1); });
