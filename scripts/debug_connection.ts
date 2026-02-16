import "dotenv/config";
import { db } from "../backend/db/client";
import { exams, sections } from "../backend/db/schema";
import { eq } from "drizzle-orm";

async function checkIds() {
  console.log("Checking DB content with current client configuration...");

  try {
    const allExams = await db.select().from(exams);
    console.log(`Found ${allExams.length} exams.`);

    for (const exam of allExams) {
      console.log(
        `Exam ID: ${exam.id}, Title: ${exam.title}, Slug: ${exam.slug}`,
      );
      const examSections = await db
        .select()
        .from(sections)
        .where(eq(sections.examId, exam.id));
      console.log(`  -> Has ${examSections.length} sections.`);
    }

    if (allExams.length === 0) {
      console.error(
        "❌ No exams found. Database might be empty or connection failed.",
      );
    } else {
      console.log("✅ Database connection seems successful.");
    }
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
}

checkIds();
