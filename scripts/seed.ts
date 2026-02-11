import { db } from "../lib/db/client";
import { sections, questions } from "../lib/db/schema";

/**
 * サンプルデータ投入スクリプト
 * 
 * 実行方法:
 * tsx scripts/seed.ts
 */

async function seed() {
  console.log("🌱 Seeding database...");

  // セクション1: 基礎知識
  const [section1] = await db
    .insert(sections)
    .values({
      title: "基礎知識",
      description: "資格試験の基本的な内容を学習します",
      order: 1,
    })
    .returning();

  console.log(`✅ Created section: ${section1.title}`);

  // セクション1の問題（7問）
  const section1Questions = [
    {
      questionText: "次のうち、正しい記述はどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "A",
      explanation: "選択肢Aが正解です。なぜなら...",
    },
    {
      questionText: "次のうち、誤った記述はどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "B",
      explanation: "選択肢Bが誤りです。正しくは...",
    },
    {
      questionText: "次の説明に最も適した用語はどれですか？",
      optionA: "用語A",
      optionB: "用語B",
      optionC: "用語C",
      optionD: "用語D",
      correctAnswer: "C",
      explanation: "用語Cが最も適切です。",
    },
    {
      questionText: "次のうち、最も効率的な方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "D",
      explanation: "方法Dが最も効率的です。",
    },
    {
      questionText: "次の計算結果として正しいものはどれですか？",
      optionA: "100",
      optionB: "200",
      optionC: "300",
      optionD: "400",
      correctAnswer: "B",
      explanation: "計算結果は200です。",
    },
    {
      questionText: "次のうち、推奨される手順はどれですか？",
      optionA: "手順A",
      optionB: "手順B",
      optionC: "手順C",
      optionD: "手順D",
      correctAnswer: "A",
      explanation: "手順Aが推奨されます。",
    },
    {
      questionText: "次の説明に該当するものはどれですか？",
      optionA: "項目A",
      optionB: "項目B",
      optionC: "項目C",
      optionD: "項目D",
      correctAnswer: "C",
      explanation: "項目Cが該当します。",
    },
  ];

  for (let i = 0; i < section1Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section1.id,
      ...section1Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section1Questions.length} questions for section 1`);

  // セクション2: 応用問題
  const [section2] = await db
    .insert(sections)
    .values({
      title: "応用問題",
      description: "実践的な応用問題に挑戦します",
      order: 2,
    })
    .returning();

  console.log(`✅ Created section: ${section2.title}`);

  // セクション2の問題（7問）
  const section2Questions = [
    {
      questionText: "次のケースで最も適切な対応はどれですか？",
      optionA: "対応A",
      optionB: "対応B",
      optionC: "対応C",
      optionD: "対応D",
      correctAnswer: "B",
      explanation: "対応Bが最も適切です。",
    },
    {
      questionText: "次の状況で優先すべき事項はどれですか？",
      optionA: "事項A",
      optionB: "事項B",
      optionC: "事項C",
      optionD: "事項D",
      correctAnswer: "A",
      explanation: "事項Aを優先すべきです。",
    },
    {
      questionText: "次のうち、リスクが最も高いものはどれですか？",
      optionA: "リスクA",
      optionB: "リスクB",
      optionC: "リスクC",
      optionD: "リスクD",
      correctAnswer: "C",
      explanation: "リスクCが最も高いです。",
    },
    {
      questionText: "次の問題を解決する最良の方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "D",
      explanation: "方法Dが最良です。",
    },
    {
      questionText: "次のうち、コストが最も低いものはどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "B",
      explanation: "選択肢Bが最もコストが低いです。",
    },
    {
      questionText: "次の改善案で最も効果的なものはどれですか？",
      optionA: "改善案A",
      optionB: "改善案B",
      optionC: "改善案C",
      optionD: "改善案D",
      correctAnswer: "A",
      explanation: "改善案Aが最も効果的です。",
    },
    {
      questionText: "次のうち、法令に違反するものはどれですか？",
      optionA: "行為A",
      optionB: "行為B",
      optionC: "行為C",
      optionD: "行為D",
      correctAnswer: "C",
      explanation: "行為Cは法令違反です。",
    },
  ];

  for (let i = 0; i < section2Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section2.id,
      ...section2Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section2Questions.length} questions for section 2`);

  // セクション3: 実践演習
  const [section3] = await db
    .insert(sections)
    .values({
      title: "実践演習",
      description: "実際の試験に近い形式で演習します",
      order: 3,
    })
    .returning();

  console.log(`✅ Created section: ${section3.title}`);

  // セクション3の問題（7問）
  const section3Questions = [
    {
      questionText: "次のシナリオで取るべき行動はどれですか？",
      optionA: "行動A",
      optionB: "行動B",
      optionC: "行動C",
      optionD: "行動D",
      correctAnswer: "B",
      explanation: "行動Bが適切です。",
    },
    {
      questionText: "次の計画で最も重要な要素はどれですか？",
      optionA: "要素A",
      optionB: "要素B",
      optionC: "要素C",
      optionD: "要素D",
      correctAnswer: "A",
      explanation: "要素Aが最も重要です。",
    },
    {
      questionText: "次のうち、ベストプラクティスはどれですか？",
      optionA: "プラクティスA",
      optionB: "プラクティスB",
      optionC: "プラクティスC",
      optionD: "プラクティスD",
      correctAnswer: "C",
      explanation: "プラクティスCがベストプラクティスです。",
    },
    {
      questionText: "次の評価基準で最も重視すべきものはどれですか？",
      optionA: "基準A",
      optionB: "基準B",
      optionC: "基準C",
      optionD: "基準D",
      correctAnswer: "D",
      explanation: "基準Dを最も重視すべきです。",
    },
    {
      questionText: "次のうち、持続可能な方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "B",
      explanation: "方法Bが持続可能です。",
    },
    {
      questionText: "次の戦略で最も効果的なものはどれですか？",
      optionA: "戦略A",
      optionB: "戦略B",
      optionC: "戦略C",
      optionD: "戦略D",
      correctAnswer: "A",
      explanation: "戦略Aが最も効果的です。",
    },
    {
      questionText: "次のうち、倫理的に問題があるものはどれですか？",
      optionA: "行為A",
      optionB: "行為B",
      optionC: "行為C",
      optionD: "行為D",
      correctAnswer: "C",
      explanation: "行為Cは倫理的に問題があります。",
    },
  ];

  for (let i = 0; i < section3Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section3.id,
      ...section3Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section3Questions.length} questions for section 3`);

  console.log("🎉 Seeding completed!");
  console.log(`Total: 3 sections, 21 questions`);
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
