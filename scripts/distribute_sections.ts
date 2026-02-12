import { db } from "../backend/db/client";
import { sections } from "../backend/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("Distributing sections to different exams...");

  // 全セクションを取得
  const allSections = await db.select().from(sections).all();

  if (allSections.length === 0) {
    console.log("No sections found.");
    return;
  }

  // 適当に分散させる
  // Exam IDs: 1:応用午前, 2:応用午後, 3:FP3午前, 4:FP3午後

  // Update logic:
  // sections 1, 2 -> Exam 1 (keep)
  // sections 3, 4 -> Exam 2
  // sections 5, 6 -> Exam 3
  // sections 7, 8 -> Exam 4

  // ユーザー環境に合わせて調整。とりあえずIDの剰余などで割り振るか、ID範囲指定で。
  // ここでは明示的にIDで指定して更新してみる。
  // もしセクションが少なければ、新しいセクションを作る必要があるかも。

  // まずは全部 Exam 1 になっているはずなので、変更したいものだけ更新。

  // Exam 2 (応用午後)
  await db
    .update(sections)
    .set({ examId: 2, title: "応用情報午後" })
    .where(inArray(sections.id, [2, 6, 10]))
    .returning();
  console.log("Assigned sections 2, 6, 10 to Exam 2");

  // Exam 3 (FP3午前)
  await db
    .update(sections)
    .set({ examId: 3, title: "FP3級午前" })
    .where(inArray(sections.id, [3, 7, 11]))
    .returning();
  console.log("Assigned sections 3, 7, 11 to Exam 3");

  // Exam 4 (FP3午後)
  await db
    .update(sections)
    .set({ examId: 4, title: "FP3級午後" })
    .where(inArray(sections.id, [4, 8, 12]))
    .returning();
  console.log("Assigned sections 4, 8, 12 to Exam 4");

  // 残りは Exam 1 のまま (update title to match context if needed)
  await db
    .update(sections)
    .set({ title: "応用情報午前" })
    .where(eq(sections.examId, 1))
    .returning();

  console.log("Distribution completed.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
