import fs from "fs";
import path from "path";
import { db } from "../src/backend/db/client";
import {
  exams,
  examYears,
  questions,
  sections,
} from "../src/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * 応用情報 午前（4択問題）mdインポートスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-ap-gozen.ts
 *
 * rawData/IPA_kakomon/応用情報午前/ 以下の全期分を一括インポートします。
 * - 問題.md  → questionText, optionA〜D
 * - 解答.md  → correctAnswer（IPA公式を正とする）
 * - 解説.md  → explanation
 * - 画像ファイル → public/images/kakomon/ にコピー
 */

// ─── 設定 ─────────────────────────────────────────────
const EXAM_TITLE = "応用情報 午前";
const RAW_DATA_DIR = path.join(
  process.cwd(),
  "rawData",
  "IPA_kakomon",
  "応用情報午前",
);
const QUESTIONS_PER_SECTION = 5; // 5問ごとに1セクション（FP2と同じ）

// フォルダ名 → { year, season, label }
function parseDirName(dirName: string): {
  year: number;
  season: "spring" | "autumn";
  label: string;
} {
  const [yearStr, seasonStr] = dirName.split("_");
  const year = parseInt(yearStr, 10);
  const season = seasonStr === "haru" ? "spring" : "autumn";
  const reiwa = year - 2018;
  const seasonLabel = season === "spring" ? "春期" : "秋期";
  const label = `令和${reiwa}年度 ${seasonLabel}`;
  return { year, season, label };
}

// ─── 問題.md パーサー ──────────────────────────────────
interface ParsedQuestion {
  questionNumber: number;
  questionText: string; // 選択肢を除いた問題文
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
}

function parseQuestionsFile(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const results: ParsedQuestion[] = [];

  // ## 問X で分割
  const sections = content.split(/^## 問(\d+)/gm);
  // sections = ['before', '1', 'body1', '2', 'body2', ...]

  for (let i = 1; i < sections.length; i += 2) {
    const num = parseInt(sections[i], 10);
    const body = (sections[i + 1] || "").trim();

    // 選択肢のパースを試みる
    const parsed = parseOptions(body);
    results.push({
      questionNumber: num,
      ...parsed,
    });
  }

  return results;
}

function parseOptions(body: string): {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
} {
  // パターン1: テキスト選択肢（行頭 "ア ", "イ ", "ウ ", "エ "）
  // 正規表現で各選択肢を抽出
  const optRegex =
    /^(ア\s[\s\S]*?)(?=^イ\s)/m;

  // アイウエの各選択肢を見つける
  const lines = body.split("\n");
  let optAStart = -1,
    optBStart = -1,
    optCStart = -1,
    optDStart = -1;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (/^ア[\s　]/.test(line)) optAStart = li;
    else if (/^イ[\s　]/.test(line)) optBStart = li;
    else if (/^ウ[\s　]/.test(line)) optCStart = li;
    else if (/^エ[\s　]/.test(line)) optDStart = li;
  }

  // テキスト形式の選択肢がある場合
  if (optAStart >= 0 && optBStart >= 0) {
    const questionText = lines.slice(0, optAStart).join("\n").trim();

    const getOption = (start: number, end: number): string => {
      return lines
        .slice(start, end)
        .join("\n")
        .replace(/^[ア-エ][\s　]/, "")
        .trim();
    };

    const optsOrder = [
      { label: "A", start: optAStart },
      { label: "B", start: optBStart },
      ...(optCStart >= 0 ? [{ label: "C", start: optCStart }] : []),
      ...(optDStart >= 0 ? [{ label: "D", start: optDStart }] : []),
    ].sort((a, b) => a.start - b.start);

    const optValues: Record<string, string> = {};
    for (let j = 0; j < optsOrder.length; j++) {
      const endLine =
        j < optsOrder.length - 1
          ? optsOrder[j + 1].start
          : lines.length;
      optValues[optsOrder[j].label] = getOption(
        optsOrder[j].start,
        endLine,
      );
    }

    return {
      questionText,
      optionA: optValues["A"] || "",
      optionB: optValues["B"] || "",
      optionC: optValues["C"] || null,
      optionD: optValues["D"] || null,
    };
  }

  // パターン2: テーブル形式の選択肢（| ア | ... |）
  // この場合、テーブル全体を問題文に含める
  // OR 画像に選択肢が含まれている場合
  // → 問題文全体を questionText にし、選択肢は空文字列
  return {
    questionText: body,
    optionA: "ア",
    optionB: "イ",
    optionC: "ウ",
    optionD: "エ",
  };
}

// ─── 解答.md パーサー ──────────────────────────────────
function parseAnswersFile(
  filePath: string,
): Map<number, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<number, string>();

  const matches = content.matchAll(
    /^\|\s*問(\d+)\s*\|\s*([ア-エ])\s*\|/gm,
  );
  for (const m of matches) {
    const num = parseInt(m[1], 10);
    const answer = m[2];
    // ア→A, イ→B, ウ→C, エ→D に変換
    const ansMap: Record<string, string> = {
      ア: "A",
      イ: "B",
      ウ: "C",
      エ: "D",
    };
    map.set(num, ansMap[answer] || answer);
  }
  return map;
}

// ─── 解説.md パーサー ──────────────────────────────────
function parseExplanationsFile(
  filePath: string,
): Map<number, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<number, string>();

  const secs = content.split(/^## 問(\d+)/gm);
  for (let i = 1; i < secs.length; i += 2) {
    const num = parseInt(secs[i], 10);
    const body = (secs[i + 1] || "").trim();
    map.set(num, body);
  }
  return map;
}

// ─── 画像処理 ──────────────────────────────────────────
function processImages(
  text: string,
  sourceDir: string,
  destDir: string,
  copyPromises: Promise<void>[],
): string {
  if (!text) return text;

  // ![alt](filename.png) を検出
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  return text.replace(regex, (match, alt, imgPath) => {
    const filename = path.basename(imgPath);
    const sourcePath = path.join(sourceDir, filename);
    const destPath = path.join(destDir, filename);

    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
      copyPromises.push(fs.promises.copyFile(sourcePath, destPath));
    }

    // 公開パスに書き換え
    const publicPath = `/images/kakomon/${path.basename(destDir)}/${filename}`;
    return `![${alt}](${publicPath})`;
  });
}

// ─── メイン処理 ────────────────────────────────────────
async function main() {
  console.log("🚀 応用情報 午前 インポート開始\n");

  // 1. 試験区分の取得
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.title, EXAM_TITLE));

  if (!exam) {
    console.error(`❌ 試験区分「${EXAM_TITLE}」が見つかりません`);
    process.exit(1);
  }
  console.log(`✅ 試験区分: id=${exam.id}, title="${exam.title}"`);

  // 2. フォルダ一覧を取得
  const dirs = fs
    .readdirSync(RAW_DATA_DIR)
    .filter((d) =>
      fs.statSync(path.join(RAW_DATA_DIR, d)).isDirectory(),
    )
    .sort();

  console.log(`📁 対象フォルダ: ${dirs.length}件\n`);

  let totalInsert = 0;
  let totalUpdate = 0;
  let totalImageCopy = 0;
  let globalSectionOrder = 0; // セクションの通し番号（1, 2, 3, ...）

  for (const dirName of dirs) {
    const dirPath = path.join(RAW_DATA_DIR, dirName);
    const { year, season, label } = parseDirName(dirName);

    console.log(`--- ${label} (${dirName}) ---`);

    // ファイルの存在確認
    const qFile = path.join(dirPath, "問題.md");
    const aFile = path.join(dirPath, "解答.md");
    const kFile = path.join(dirPath, "解説.md");

    if (!fs.existsSync(qFile) || !fs.existsSync(aFile)) {
      console.warn(`  ⚠️ 問題.md または 解答.md が見つかりません。スキップ。`);
      continue;
    }

    // 3. ExamYear の取得・作成
    let examYearId: number;
    const [existingYear] = await db
      .select()
      .from(examYears)
      .where(
        and(
          eq(examYears.examId, exam.id),
          eq(examYears.year, year),
          eq(examYears.season, season),
        ),
      );

    if (existingYear) {
      examYearId = existingYear.id;
      console.log(`  ✅ 年度情報を取得: ${label} (id=${examYearId})`);
    } else {
      const [newYear] = await db
        .insert(examYears)
        .values({ examId: exam.id, year, season, label })
        .returning({ id: examYears.id });
      examYearId = newYear.id;
      console.log(`  ✅ 年度情報を新規作成: ${label} (id=${examYearId})`);
    }

    // 4. ファイルをパース
    const parsedQuestions = parseQuestionsFile(qFile);
    const answers = parseAnswersFile(aFile);
    const explanations = fs.existsSync(kFile)
      ? parseExplanationsFile(kFile)
      : new Map<number, string>();

    console.log(
      `  📊 問題: ${parsedQuestions.length}件, 解答: ${answers.size}件, 解説: ${explanations.size}件`,
    );

    // 5. 画像ディレクトリの準備
    const folderSlug = `AP_${dirName}`;
    const publicImagesDir = path.join(
      process.cwd(),
      "public",
      "images",
      "kakomon",
      folderSlug,
    );
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    const copyPromises: Promise<void>[] = [];
    const sectionCache = new Map<string, number>();
    let insertCount = 0;
    let updateCount = 0;

    // 6. 問題ごとの処理
    for (const q of parsedQuestions) {
      const correctAnswer = answers.get(q.questionNumber);
      if (!correctAnswer) {
        console.warn(
          `  ⚠️ 問${q.questionNumber}: 正解が見つかりません。スキップ。`,
        );
        continue;
      }

      // セクションの決定（5問ごと）
      const sectionIndexInYear =
        Math.floor((q.questionNumber - 1) / QUESTIONS_PER_SECTION) + 1;
      const startQ = (sectionIndexInYear - 1) * QUESTIONS_PER_SECTION + 1;
      const endQ = Math.min(sectionIndexInYear * QUESTIONS_PER_SECTION, 80);
      // タイトルはglobalSectionOrder確定後に設定（下のセクション作成時に使用）
      const sectionDesc = `${label} 問${startQ}〜${endQ}`;
      // セクションキーを年度+インデックスで一意にする
      const sectionKey = `${dirName}_${sectionIndexInYear}`;

      // セクションの取得・作成（sectionKeyで一意管理）
      let sectionId: number;
      if (!sectionCache.has(sectionKey)) {
        globalSectionOrder++;
        const sectionTitle = `#${globalSectionOrder}`;
        const [existingSec] = await db
          .select()
          .from(sections)
          .where(
            and(
              eq(sections.examId, exam.id),
              eq(sections.description, sectionDesc),
            ),
          );

        if (existingSec) {
          // orderとtitleを連番に更新
          await db.update(sections).set({ order: globalSectionOrder, title: sectionTitle }).where(eq(sections.id, existingSec.id));
          sectionId = existingSec.id;
        } else {
          const [newSec] = await db
            .insert(sections)
            .values({
              examId: exam.id,
              title: sectionTitle,
              description: sectionDesc,
              order: globalSectionOrder,
            })
            .returning({ id: sections.id });
          sectionId = newSec.id;
        }
        sectionCache.set(sectionKey, sectionId);
      }
      sectionId = sectionCache.get(sectionKey)!;

      // 画像処理
      const qText = processImages(
        q.questionText,
        dirPath,
        publicImagesDir,
        copyPromises,
      );
      const optA = processImages(
        q.optionA,
        dirPath,
        publicImagesDir,
        copyPromises,
      );
      const optB = processImages(
        q.optionB,
        dirPath,
        publicImagesDir,
        copyPromises,
      );
      const optC = q.optionC
        ? processImages(
            q.optionC,
            dirPath,
            publicImagesDir,
            copyPromises,
          )
        : null;
      const optD = q.optionD
        ? processImages(
            q.optionD,
            dirPath,
            publicImagesDir,
            copyPromises,
          )
        : null;
      const explanation = explanations.has(q.questionNumber)
        ? processImages(
            explanations.get(q.questionNumber)!,
            dirPath,
            publicImagesDir,
            copyPromises,
          )
        : null;

      // 画像判定
      const hasImage = [qText, optA, optB, optC, optD, explanation].some(
        (t) => t && t.includes("/images/kakomon/"),
      );

      const questionData = {
        sectionId,
        questionText: qText,
        questionType: "choice" as const,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer,
        explanation: explanation || null,
        order: q.questionNumber,
        examYearId,
        questionNumber: q.questionNumber,
        hasImage,
        sourceNote: `${label} 問${q.questionNumber}`,
      };

      // 既存チェック
      const [existingQ] = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.examYearId, examYearId),
            eq(questions.questionNumber, q.questionNumber),
          ),
        );

      if (existingQ) {
        await db
          .update(questions)
          .set(questionData)
          .where(eq(questions.id, existingQ.id));
        updateCount++;
      } else {
        await db.insert(questions).values(questionData);
        insertCount++;
      }
    }

    // 画像コピー待ち
    await Promise.all(copyPromises);

    console.log(
      `  📝 新規: ${insertCount}件, 更新: ${updateCount}件, 画像: ${copyPromises.length}件`,
    );
    totalInsert += insertCount;
    totalUpdate += updateCount;
    totalImageCopy += copyPromises.length;
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`🎉 インポート完了!`);
  console.log(`  新規追加: ${totalInsert} 件`);
  console.log(`  更新: ${totalUpdate} 件`);
  console.log(`  画像コピー: ${totalImageCopy} 件`);
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
