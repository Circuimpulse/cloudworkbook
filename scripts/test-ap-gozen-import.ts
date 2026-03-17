import { db } from "../src/backend/db/client";
import {
  exams,
  examYears,
  sections,
  questions,
} from "../src/backend/db/schema";
import { eq, and, sql, isNull, like } from "drizzle-orm";
import fs from "fs";
import path from "path";

/**
 * 応用情報午前インポートデータの検証テスト
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function main() {
  console.log("🧪 応用情報午前 インポートデータ検証テスト\n");

  // === テスト1: 試験区分の存在確認 ===
  console.log("【テスト1】試験区分の存在確認");
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.title, "応用情報 午前"));
  assert(!!exam, "試験区分「応用情報 午前」が存在する");
  assert(exam?.slug === "ap-gozen", `slugが"ap-gozen"である (実際: "${exam?.slug}")`);

  if (!exam) {
    console.log("\n❌ 試験区分が見つからないため、テスト中断");
    return;
  }

  // === テスト2: 年度数の確認 ===
  console.log("\n【テスト2】年度データの確認");
  const years = await db
    .select()
    .from(examYears)
    .where(eq(examYears.examId, exam.id));
  assert(years.length === 9, `年度が9件存在する (実際: ${years.length}件)`);

  // 各年度のラベル確認
  const expectedLabels = [
    "令和2年度 秋期",
    "令和3年度 春期",
    "令和3年度 秋期",
    "令和4年度 春期",
    "令和4年度 秋期",
    "令和5年度 春期",
    "令和5年度 秋期",
    "令和6年度 春期",
    "令和6年度 秋期",
  ];
  for (const label of expectedLabels) {
    const found = years.find((y) => y.label === label);
    assert(!!found, `年度「${label}」が存在する`);
  }

  // === テスト3: セクション数の確認 ===
  console.log("\n【テスト3】セクションデータの確認");
  const allSections = await db
    .select()
    .from(sections)
    .where(eq(sections.examId, exam.id));
  assert(
    allSections.length === 144,
    `セクションが144件(16セクション×9期)存在する (実際: ${allSections.length}件)`,
  );

  // === テスト4: 問題数の確認 ===
  console.log("\n【テスト4】問題データの確認");
  let totalQuestions = 0;
  for (const y of years) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.examYearId, y.id));
    const cnt = Number(count);
    totalQuestions += cnt;
    assert(cnt === 80, `${y.label}: 80問存在する (実際: ${cnt}問)`);
  }
  assert(
    totalQuestions === 720,
    `合計720問存在する (実際: ${totalQuestions}問)`,
  );

  // === テスト5: 問題番号の連続性チェック ===
  console.log("\n【テスト5】問題番号の連続性");
  for (const y of years) {
    const qs = await db
      .select({ qn: questions.questionNumber })
      .from(questions)
      .where(eq(questions.examYearId, y.id));
    const nums = qs.map((q) => q.qn!).sort((a, b) => a - b);
    const expected = Array.from({ length: 80 }, (_, i) => i + 1);
    const isSequential = JSON.stringify(nums) === JSON.stringify(expected);
    assert(isSequential, `${y.label}: 問1〜問80が連番で存在する`);
  }

  // === テスト6: 正解データの検証 ===
  console.log("\n【テスト6】正解データの検証");
  const allQuestions = await db
    .select()
    .from(questions)
    .where(
      sql`${questions.examYearId} IN (${sql.join(
        years.map((y) => sql`${y.id}`),
        sql`,`,
      )})`,
    );

  const validAnswers = ["A", "B", "C", "D"];
  const invalidAnswers = allQuestions.filter(
    (q) => !validAnswers.includes(q.correctAnswer),
  );
  assert(
    invalidAnswers.length === 0,
    `全問題の正解がA〜Dのいずれかである (不正: ${invalidAnswers.length}件)`,
  );

  // 正解の分布確認（偏りがないか）
  const answerDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of allQuestions) answerDist[q.correctAnswer]++;
  console.log(
    `  📊 正解分布: A=${answerDist.A}, B=${answerDist.B}, C=${answerDist.C}, D=${answerDist.D}`,
  );
  // 各選択肢が最低15%以上はあるはず
  for (const [key, count] of Object.entries(answerDist)) {
    const pct = (count / allQuestions.length) * 100;
    assert(pct > 15, `正解${key}の割合が15%以上 (${pct.toFixed(1)}%)`);
  }

  // === テスト7: 問題文の空チェック ===
  console.log("\n【テスト7】問題文・選択肢の空チェック");
  const emptyText = allQuestions.filter(
    (q) => !q.questionText || q.questionText.trim().length === 0,
  );
  assert(
    emptyText.length === 0,
    `問題文が空の問題がない (空: ${emptyText.length}件)`,
  );

  const emptyOptA = allQuestions.filter(
    (q) => !q.optionA || q.optionA.trim().length === 0,
  );
  assert(
    emptyOptA.length === 0,
    `選択肢Aが空の問題がない (空: ${emptyOptA.length}件)`,
  );

  const emptyOptB = allQuestions.filter(
    (q) => !q.optionB || q.optionB.trim().length === 0,
  );
  assert(
    emptyOptB.length === 0,
    `選択肢Bが空の問題がない (空: ${emptyOptB.length}件)`,
  );

  // === テスト8: 解説データの確認 ===
  console.log("\n【テスト8】解説データの確認");
  const noExplanation = allQuestions.filter(
    (q) => !q.explanation || q.explanation.trim().length === 0,
  );
  assert(
    noExplanation.length === 0,
    `解説が空の問題がない (空: ${noExplanation.length}件)`,
  );

  // 解説の平均文字数
  const avgExplanationLen =
    allQuestions.reduce(
      (sum, q) => sum + (q.explanation?.length || 0),
      0,
    ) / allQuestions.length;
  console.log(`  📊 解説の平均文字数: ${Math.round(avgExplanationLen)}文字`);
  assert(
    avgExplanationLen > 100,
    `解説の平均文字数が100文字以上 (${Math.round(avgExplanationLen)}文字)`,
  );

  // === テスト9: sourceNote の確認 ===
  console.log("\n【テスト9】出典メモの確認");
  const noSource = allQuestions.filter(
    (q) => !q.sourceNote || q.sourceNote.trim().length === 0,
  );
  assert(
    noSource.length === 0,
    `sourceNoteが空の問題がない (空: ${noSource.length}件)`,
  );

  // sourceNoteのフォーマット確認
  const sampleSources = allQuestions.slice(0, 5).map((q) => q.sourceNote);
  console.log(`  📊 サンプルsourceNote: ${sampleSources.join(", ")}`);

  // === テスト10: 画像ファイルの存在確認 ===
  console.log("\n【テスト10】画像ファイルの存在確認");
  const imageQuestions = allQuestions.filter((q) => q.hasImage);
  console.log(`  📊 画像あり問題: ${imageQuestions.length}件`);

  // 画像パスが実在するか確認（questionTextとexplanation内の画像）
  let missingImages = 0;
  const checkedPaths = new Set<string>();
  for (const q of allQuestions) {
    const texts = [
      q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.explanation,
    ];
    for (const t of texts) {
      if (!t) continue;
      const imgMatches = t.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
      for (const m of imgMatches) {
        const imgPath = m[1];
        if (imgPath.startsWith("/images/kakomon/") && !checkedPaths.has(imgPath)) {
          checkedPaths.add(imgPath);
          const fullPath = path.join(process.cwd(), "public", imgPath);
          if (!fs.existsSync(fullPath)) {
            console.log(`    ⚠️ 画像が見つからない: ${imgPath}`);
            missingImages++;
          }
        }
      }
    }
  }
  assert(
    missingImages === 0,
    `参照されている画像ファイルが全て存在する (不足: ${missingImages}件)`,
  );
  console.log(`  📊 確認した画像パス: ${checkedPaths.size}件`);

  // === テスト11: セクションへの問題割り当て確認 ===
  console.log("\n【テスト11】セクション内の問題数確認");
  let sectionIssues = 0;
  for (const sec of allSections) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.sectionId, sec.id));
    const cnt = Number(count);
    if (cnt !== 5) {
      console.log(
        `    ⚠️ セクション「${sec.title}」(order=${sec.order}): ${cnt}問 (期待: 5問)`,
      );
      sectionIssues++;
    }
  }
  assert(
    sectionIssues === 0,
    `全セクションが5問ずつ含む (異常: ${sectionIssues}件)`,
  );

  // === テスト12: 具体的な問題内容の抜き取り検証 ===
  console.log("\n【テスト12】具体的な問題内容の抜き取り検証");

  // 2024_aki 問1 の検証
  const y2024aki = years.find(
    (y) => y.year === 2024 && y.season === "autumn",
  );
  if (y2024aki) {
    const [q1] = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.examYearId, y2024aki.id),
          eq(questions.questionNumber, 1),
        ),
      );
    assert(!!q1, "令和6秋 問1が取得できる");
    if (q1) {
      assert(
        q1.questionText.includes("AI") || q1.questionText.length > 10,
        "令和6秋 問1の問題文に内容がある",
      );
      assert(q1.correctAnswer.length === 1, "令和6秋 問1の正解が1文字(A〜D)");
    }
  }

  // ─── 結果サマリー ───
  console.log(`\n${"═".repeat(50)}`);
  console.log(`🧪 テスト結果: ✅ ${passed}件 成功 / ❌ ${failed}件 失敗`);
  if (failed === 0) {
    console.log("🎉 全テストパス！");
  } else {
    console.log("⚠️ 失敗したテストがあります。確認してください。");
  }
}

main().catch(console.error);
