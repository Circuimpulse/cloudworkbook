/**
 * 全セクションに問題を追加するスクリプト
 * 各セクションに最低30問の問題を追加します
 */

// 環境変数を設定
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./local.db";

import { db } from "../backend/db/client";
import { questions, sections } from "../backend/db/schema";
import { eq } from "drizzle-orm";

async function addQuestionsToAllSections() {
  console.log("🌱 Adding questions to all sections...");

  // 全セクションを取得
  const allSections = await db.select().from(sections).all();
  
  if (allSections.length === 0) {
    console.error("❌ No sections found. Please run seed.ts first.");
    return;
  }

  console.log(`📊 Found ${allSections.length} sections`);

  for (const section of allSections) {
    // 既存の問題数を確認
    const existingQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.sectionId, section.id))
      .all();

    console.log(`\n📝 Section: ${section.title} (ID: ${section.id})`);
    console.log(`   Existing questions: ${existingQuestions.length}`);

    // 最低30問になるまで問題を追加
    const targetCount = 30;
    const questionsToAdd = targetCount - existingQuestions.length;

    if (questionsToAdd <= 0) {
      console.log(`   ✅ Already have ${existingQuestions.length} questions.`);
      continue;
    }

    console.log(`   Adding ${questionsToAdd} questions...`);

    const newQuestions = [];
    const startOrder = existingQuestions.length + 1;

    for (let i = 0; i < questionsToAdd; i++) {
      const questionNumber = startOrder + i;
      newQuestions.push({
        sectionId: section.id,
        questionText: `${section.title} 問題${questionNumber}: この問題はテスト用問題です。正しい選択肢を選んでください。`,
        optionA: `選択肢A - 不正解 ${questionNumber}`,
        optionB: `選択肢B - 正解 ${questionNumber}`,
        optionC: `選択肢C - 不正解 ${questionNumber}`,
        optionD: `選択肢D - 不正解 ${questionNumber}`,
        correctAnswer: "B",
        explanation: `問題${questionNumber}の解説: 選択肢Bが正解です。`,
        order: questionNumber,
      });
    }

    // 一括挿入
    if (newQuestions.length > 0) {
      await db.insert(questions).values(newQuestions);
      console.log(`   ✅ Added ${questionsToAdd} questions`);
    }
  }

  console.log("\n✅ All sections updated!");
}

addQuestionsToAllSections()
  .then(() => {
    console.log("\n🎉 Questions added to all sections successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error adding questions:", error);
    process.exit(1);
  });

