import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { db } from "../src/backend/db/client";
import {
  ipaCategories,
  examYears,
  questions,
  sections,
  exams,
} from "../src/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * 過去問CSVのインポートスクリプト
 *
 * 使い方:
 * npx tsx scripts/import-csv.ts <ExamSlug> <Year> <Season>
 * 例: npx tsx scripts/import-csv.ts AP 2024 Autumn
 */

const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error("❌ エラー: 引数が不足しています。");
  console.error(
    "使い方: npx tsx scripts/import-csv.ts <ExamSlug> <Year> <Season>",
  );
  process.exit(1);
}

const [examSlug, yearStr, season] = args;
const year = parseInt(yearStr, 10);
const folderName = `${examSlug}_${year}_${season}`;
const targetDir = path.join(process.cwd(), "IPA_kakomon", folderName);
const markdownFile = path.join(targetDir, "data.csv");
const sourceImagesDir = path.join(targetDir, "images");
const publicImagesDir = path.join(
  process.cwd(),
  "public",
  "images",
  "kakomon",
  folderName,
);

// バリデーション
if (!fs.existsSync(markdownFile)) {
  console.error(`❌ CSVファイルが見つかりません: ${markdownFile}`);
  process.exit(1);
}

const QUESTIONS_PER_SECTION = 5;

// ------------------------------------------------------------------
// ヘルパー関数群
// ------------------------------------------------------------------

/**
 * 画像ファイルをコピーし、Markdown内のパスを書き換える
 */
async function processImagesInMarkdown(
  text: string,
  copyPromises: Promise<void>[],
): Promise<string> {
  if (!text) return text;

  // Markdownの画像記法 ![alt](images/filename.ext) を探す
  const regex = /!\[([^\]]*)\]\((images\/[^)]+)\)/g;

  const newText = text.replace(regex, (match, alt, imagePath) => {
    const filename = path.basename(imagePath);
    const sourcePath = path.join(sourceImagesDir, filename);
    const destPath = path.join(publicImagesDir, filename);

    // 画像ファイルをパブリックディレクトリにコピー
    if (fs.existsSync(sourcePath)) {
      copyPromises.push(fs.promises.copyFile(sourcePath, destPath));
    } else {
      console.warn(`⚠️ 警告: 画像が見つかりません - ${sourcePath}`);
    }

    // フロントエンド配信用パスに書き換え
    return `![${alt}](/images/kakomon/${folderName}/${filename})`;
  });

  return newText;
}

/**
 * IPAカテゴリIDを取得または作成する
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateCategory(
  name: string,
  level: number,
  parentId?: number,
): Promise<number | undefined> {
  if (!name) return undefined;

  let query = db
    .select({ id: ipaCategories.id })
    .from(ipaCategories)
    .where(eq(ipaCategories.name, name))
    .$dynamic();

  if (parentId) {
    query = query.where(eq(ipaCategories.parentId, parentId));
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.where(eq(ipaCategories.parentId, null as any));
  }

  const existing = await query.limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [inserted] = await db
    .insert(ipaCategories)
    .values({
      name,
      level,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parentId: parentId || (null as any),
    })
    .returning({ id: ipaCategories.id });
  return inserted.id;
}

// ------------------------------------------------------------------
// メイン処理
// ------------------------------------------------------------------
async function main() {
  console.log(`🚀 インポート開始: ${folderName}`);

  // 1. パブリック画像フォルダの準備
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
    console.log(`📁 作成しました: ${publicImagesDir}`);
  }

  // 2. Exam (試験区分) の取得・作成
  let examId: number;
  const examTitle = examSlug === "AP" ? "応用情報試験：午前" : examSlug; // とりあえずAPはマッピング
  const [existingExam] = await db
    .select({ id: exams.id, title: exams.title })
    .from(exams)
    .where(eq(exams.title, examTitle));

  if (existingExam) {
    examId = existingExam.id;
    console.log(`✅ 試験情報を取得: ${existingExam.title}`);
  } else {
    const [newExam] = await db
      .insert(exams)
      .values({
        title: examTitle,
        slug: examSlug.toLowerCase(),
      })
      .returning({ id: exams.id });
    examId = newExam.id;
    console.log(`✅ 試験情報を新規作成: ${examTitle}`);
  }

  // 3. ExamYear の取得・作成
  let examYearId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasonEnums: "spring" | "autumn" = season.toLowerCase() as any;
  const seasonLabel = seasonEnums === "spring" ? "春期" : "秋期";
  // 和暦変換（簡易的・令和のみ）
  const reiwa = year - 2018;
  const label = `令和${reiwa}年度 ${seasonLabel}`;

  const [existingExamYear] = await db
    .select({ id: examYears.id })
    .from(examYears)
    .where(
      and(
        eq(examYears.examId, examId),
        eq(examYears.year, year),
        eq(examYears.season, seasonEnums),
      ),
    );

  if (existingExamYear) {
    examYearId = existingExamYear.id;
    console.log(`✅ 年度情報を取得: ${label}`);
  } else {
    const [newExamYear] = await db
      .insert(examYears)
      .values({
        examId,
        year,
        season: seasonEnums,
        label,
      })
      .returning({ id: examYears.id });
    examYearId = newExamYear.id;
    console.log(`✅ 年度情報を新規作成: ${label}`);
  }

  // 4. CSV の読み込みとパース
  const csvData = fs.readFileSync(markdownFile, "utf-8");
  const parsed = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
    quoteChar: '"',
    escapeChar: '"',
  });

  if (parsed.errors.length > 0) {
    console.error("❌ CSVパースエラー:", parsed.errors);
    process.exit(1);
  }

  const rows = parsed.data as Record<string, string>[];
  console.log(`📊 読み込み件数: ${rows.length}件`);

  const copyPromises: Promise<void>[] = [];
  let insertCount = 0;
  let updateCount = 0;

  // セクション管理: 既存の最大orderを取得し、そこから連番を続ける
  const existingSections = await db
    .select({ order: sections.order })
    .from(sections)
    .where(eq(sections.examId, examId));
  let nextSectionOrder = existingSections.length > 0
    ? Math.max(...existingSections.map(s => s.order))
    : 0;
  const sectionCache = new Map<number, number>(); // sectionIndexInYear -> sectionId

  // 5. 行ごとの処理
  for (const row of rows) {
    const qNum = parseInt(row.questionNumber, 10);
    if (isNaN(qNum)) continue;

    // カテゴリの解決
    const catL1 = await getOrCreateCategory(row.categoryLevel1, 1);
    const catL2 = catL1
      ? await getOrCreateCategory(row.categoryLevel2, 2, catL1)
      : undefined;
    const catL3 = catL2
      ? await getOrCreateCategory(row.categoryLevel3, 3, catL2)
      : undefined;
    const finalCategoryId = catL3 || catL2 || catL1 || undefined;

    // セクションの決定（5問ごとに分割）
    const sectionIndexInYear = Math.floor((qNum - 1) / QUESTIONS_PER_SECTION) + 1;
    const startQ = (sectionIndexInYear - 1) * QUESTIONS_PER_SECTION + 1;
    const endQ = Math.min(sectionIndexInYear * QUESTIONS_PER_SECTION, 80);
    const sectionDesc = `${label} 問${startQ}〜${endQ}`;

    let sectionId: number;
    if (!sectionCache.has(sectionIndexInYear)) {
      const [existingSection] = await db
        .select({ id: sections.id })
        .from(sections)
        .where(
          and(eq(sections.examId, examId), eq(sections.description, sectionDesc)),
        );

      if (existingSection) {
        // orderとtitleを連番に更新
        nextSectionOrder++;
        await db.update(sections).set({ order: nextSectionOrder, title: `#${nextSectionOrder}` }).where(eq(sections.id, existingSection.id));
        sectionCache.set(sectionIndexInYear, existingSection.id);
      } else {
        nextSectionOrder++;
        const [newSection] = await db
          .insert(sections)
          .values({
            examId,
            title: `#${nextSectionOrder}`,
            description: sectionDesc,
            order: nextSectionOrder,
          })
          .returning({ id: sections.id });
        sectionCache.set(sectionIndexInYear, newSection.id);
      }
    }
    sectionId = sectionCache.get(sectionIndexInYear)!;

    // Markdown内の画像を処理
    const [qText, optA, optB, optC, optD, exp] = await Promise.all([
      processImagesInMarkdown(row.questionText, copyPromises),
      processImagesInMarkdown(row.optionA, copyPromises),
      processImagesInMarkdown(row.optionB, copyPromises),
      processImagesInMarkdown(row.optionC, copyPromises),
      processImagesInMarkdown(row.optionD, copyPromises),
      processImagesInMarkdown(row.explanation, copyPromises),
    ]);

    // 画像が含まれているかの判定
    const hasImage = [qText, optA, optB, optC, optD, exp].some(
      (t) => t && t.includes("/images/kakomon/"),
    );

    const questionCommon = {
      sectionId,
      questionText: qText,
      optionA: optA,
      optionB: optB,
      optionC: optC || null,
      optionD: optD || null,
      correctAnswer: row.correctAnswer,
      explanation: exp || null,
      order: qNum, // セクション内順序ではなく、問番号とする
      categoryId: finalCategoryId || null,
      examYearId: examYearId,
      questionNumber: qNum,
      hasImage,
      sourceNote: row.sourceNote || `${label} 問${qNum}`,
    };

    // 既存問題かどうかのチェック
    const [existingQuestion] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(
        and(
          eq(questions.examYearId, examYearId),
          eq(questions.questionNumber, qNum),
        ),
      );

    if (existingQuestion) {
      // 更新 (Upsert的)
      await db
        .update(questions)
        .set(questionCommon)
        .where(eq(questions.id, existingQuestion.id));
      updateCount++;
    } else {
      // 挿入
      await db.insert(questions).values(questionCommon);
      insertCount++;
    }
  }

  // 画像コピー待ち
  await Promise.all(copyPromises);

  console.log(`\n🎉 インポート完了!`);
  console.log(`- 新規追加: ${insertCount} 件`);
  console.log(`- 更新: ${updateCount} 件`);
  console.log(`- 画像コピー: ${copyPromises.length} 件`);
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
