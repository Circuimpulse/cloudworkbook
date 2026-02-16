/**
 * 模擬試験用の問題を追加するスクリプト
 * 既存のセクションに50問以上の問題を追加します
 */

// 環境変数を設定
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./local.db";

import { db } from "../backend/db/client";
import { questions, sections } from "../backend/db/schema";
import { eq } from "drizzle-orm";

async function addMockTestQuestions() {
  console.log("🌱 Adding mock test questions...");

  // 最初のセクションを取得
  const allSections = await db.select().from(sections).all();
  
  if (allSections.length === 0) {
    console.error("❌ No sections found. Please run seed.ts first.");
    return;
  }

  const targetSection = allSections[0];
  console.log(`✅ Target section: ${targetSection.title} (ID: ${targetSection.id})`);

  // 既存の問題数を確認
  const existingQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sectionId, targetSection.id))
    .all();

  console.log(`📊 Existing questions: ${existingQuestions.length}`);

  // 50問以上になるまで問題を追加
  const targetCount = 60; // 余裕を持って60問
  const questionsToAdd = targetCount - existingQuestions.length;

  if (questionsToAdd <= 0) {
    console.log(`✅ Already have ${existingQuestions.length} questions. No need to add more.`);
    return;
  }

  console.log(`📝 Adding ${questionsToAdd} questions...`);

  const newQuestions = [];
  const startOrder = existingQuestions.length + 1;

  for (let i = 0; i < questionsToAdd; i++) {
    const questionNumber = startOrder + i;
    newQuestions.push({
      sectionId: targetSection.id,
      questionText: `模擬試験問題 ${questionNumber}: この問題は模擬試験のテスト用問題です。正しい選択肢を選んでください。`,
      optionA: `選択肢A - 不正解の選択肢 ${questionNumber}`,
      optionB: `選択肢B - 正解の選択肢 ${questionNumber}`,
      optionC: `選択肢C - 不正解の選択肢 ${questionNumber}`,
      optionD: `選択肢D - 不正解の選択肢 ${questionNumber}`,
      correctAnswer: "B",
      explanation: `問題${questionNumber}の解説: 選択肢Bが正解です。これは模擬試験のテスト用問題として作成されました。`,
      order: questionNumber,
    });
  }

  // 一括挿入
  await db.insert(questions).values(newQuestions);

  console.log(`✅ Added ${questionsToAdd} questions successfully!`);
  console.log(`📊 Total questions in ${targetSection.title}: ${targetCount}`);
}

addMockTestQuestions()
  .then(() => {
    console.log("✅ Mock test questions added successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error adding mock test questions:", error);
    process.exit(1);
  });

