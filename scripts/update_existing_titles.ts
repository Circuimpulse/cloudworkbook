import { db } from "../backend/db/client";
import { sections } from "../backend/db/schema";

async function main() {
  console.log("Updating section titles...");

  try {
    // 全てのセクションのタイトルを「応用情報午前」に更新
    const result = await db
      .update(sections)
      .set({ title: "応用情報午前" })
      .returning();
    console.log(`Updated ${result.length} sections.`);
    result.forEach((s) =>
      console.log(`- ID: ${s.id}, Title: ${s.title}, Order: ${s.order}`),
    );
  } catch (error) {
    console.error("Failed to update titles:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
