import { db } from "../backend/db/client";
import { exams, sections } from "../backend/db/schema";
import { isNull } from "drizzle-orm";

async function main() {
  console.log("Migrating data to V2...");

  // 1. Create Exams
  const examData = [
    {
      title: "応用情報試験：午前",
      slug: "ap-am",
      description: "応用情報技術者試験 午前問題",
    },
    {
      title: "応用情報試験：午後",
      slug: "ap-pm",
      description: "応用情報技術者試験 午後問題",
    },
    {
      title: "Fp3級：午前",
      slug: "fp3-am",
      description: "FP技能検定3級 学科試験",
    },
    {
      title: "Fp3級：午後",
      slug: "fp3-pm",
      description: "FP技能検定3級 実技試験",
    },
  ];

  let defaultExamId;

  for (const data of examData) {
    // slug で重複チェック
    // onConflictDoUpdate は target 制約（unique index）が必要
    // schema で slug に unique() をつけているので OK
    const [exam] = await db
      .insert(exams)
      .values(data)
      .onConflictDoUpdate({
        target: exams.slug,
        set: { title: data.title, description: data.description },
      })
      .returning();

    if (data.slug === "ap-am") {
      defaultExamId = exam.id;
    }
    console.log(`Ensured exam: ${exam.title} (ID: ${exam.id})`);
  }

  // 2. Assign existing sections to default exam
  if (defaultExamId) {
    const result = await db
      .update(sections)
      .set({ examId: defaultExamId })
      .where(isNull(sections.examId)) // まだ紐付いていないものだけ
      .returning();

    console.log(
      `Assigned ${result.length} sections to Exam ID ${defaultExamId}`,
    );
  }

  console.log("Migration V2 completed.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
