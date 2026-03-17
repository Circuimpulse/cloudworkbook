import { db } from '../src/backend/db/client.js';
import { exams, sections, questions } from '../src/backend/db/schema.js';
import { sql, eq } from 'drizzle-orm';

async function main() {
  const examRows = await db.select().from(exams);
  console.log('=== EXAMS ===');
  for (const r of examRows) {
    console.log(`  ${r.id}: ${r.title} (format: ${r.questionFormat})`);
  }

  console.log('\n=== SECTIONS/QUESTIONS PER EXAM ===');
  for (const exam of examRows) {
    const sectionRows = await db.select().from(sections).where(eq(sections.examId, exam.id));
    const questionCount = await db.select({ count: sql<number>`count(*)` }).from(questions)
      .innerJoin(sections, eq(questions.sectionId, sections.id))
      .where(eq(sections.examId, exam.id));
    console.log(`  ${exam.title}: ${sectionRows.length} sections, ${questionCount[0]?.count || 0} questions`);
  }

  // Show AP gogo and SA sections
  for (const eid of [6, 10]) {
    const [exam] = examRows.filter(e => e.id === eid);
    if (!exam) continue;
    const secs = await db.select().from(sections).where(eq(sections.examId, eid)).orderBy(sections.order);
    console.log(`\n=== ${exam.title} セクション詳細 ===`);
    for (const s of secs.slice(0, 15)) {
      const [r] = await db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.sectionId, s.id));
      console.log(`  ${s.title}: ${s.description} (${r.count}問)`);
    }
    if (secs.length > 15) console.log(`  ... (残り${secs.length - 15}セクション)`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
