import fs from "fs";
import path from "path";

// ── .env.local 読み込み ──
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

import { db } from "../src/backend/db/client";
import { exams, examYears, sections, questions } from "../src/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * FP過去問MarkdownインポートスクリプトMDファイル（問題.md / 解答.md / 解説.md）を解析し、
 * DBに直接インポートする。画像はpublic/images/kakomon/にコピー。
 *
 * 使い方:
 *   npx tsx scripts/import-fp-md.ts <examSlug> [folderFilter]
 *
 * 例:
 *   npx tsx scripts/import-fp-md.ts fp2-gakka          # 全年度
 *   npx tsx scripts/import-fp-md.ts fp2-gakka 202305   # 特定年度のみ
 */

// ── 設定 ──
const QUESTIONS_PER_SECTION = 5;

// slug → rawDataフォルダ名のマッピング
const SLUG_TO_FOLDER: Record<string, string> = {
  "fp2-gakka": "FP2級座学",
  "fp2-jitsugi": "FP2級実技",
  "fp3-gakka": "FP3級座学",
  "fp3-jitsugi": "FP3級実技",
};

// 月→season マッピング
const MONTH_TO_SEASON: Record<string, "jan" | "may" | "sep"> = {
  "01": "jan",
  "05": "may",
  "09": "sep",
};

// 正解番号→アルファベットマッピング
const NUM_TO_ALPHA: Record<string, string> = {
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
};

// ── パーサー ──

interface ParsedQuestion {
  number: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
}

/**
 * 問題.md を解析して問題データを抽出
 */
function parseQuestionsMd(content: string): ParsedQuestion[] {
  const results: ParsedQuestion[] = [];

  // 前処理: 1行ファイル対策 - ## 問N の前に改行を挿入
  // 「## 問」後の連続数字をキャプチャし、先頭1-2桁の問番号(1-60)を分離
  content = content.replace(/## 問(\d+)/g, (match, digits: string) => {
    // 2桁を試す（10-60）
    if (digits.length >= 2) {
      const twoDigit = parseInt(digits.substring(0, 2), 10);
      if (twoDigit >= 10 && twoDigit <= 60) {
        const rest = digits.substring(2);
        return `\n## 問${twoDigit}\n${rest}`;
      }
    }
    // 1桁を試す（1-9）
    const oneDigit = parseInt(digits.substring(0, 1), 10);
    if (oneDigit >= 1 && oneDigit <= 9) {
      const rest = digits.substring(1);
      return `\n## 問${oneDigit}\n${rest}`;
    }
    return match;
  });
  // 選択肢パターンの前にも改行挿入（1行ファイル対策）
  content = content.replace(/(?<=\S)(\d\.)\s/g, "\n$1 ");

  // ## 問N で分割
  const questionBlocks = content.split(/(?=## 問\d+)/);

  for (const block of questionBlocks) {
    const headerMatch = block.match(/^## 問(\d+)/);
    if (!headerMatch) continue;

    const qNum = parseInt(headerMatch[1], 10);
    const body = block.replace(/^## 問\d+\s*/, "").trim();

    // 選択肢を分離（1. 2. 3. 4. のパターン）
    // 改行ありの場合と1行の場合の両方に対応
    const optionPattern = /(?:^|\n)\s*(\d+)\.\s*/;
    const parts = body.split(/(?:^|\n)\s*(?=\d+\.\s)/);

    if (parts.length < 2) {
      // 選択肢が見つからない場合、本文のみの問題（画像問題等）
      results.push({
        number: qNum,
        text: body,
        optionA: "",
        optionB: "",
        optionC: null,
        optionD: null,
      });
      continue;
    }

    // 問題文（最初のパート）
    const questionText = parts[0].trim();

    // 選択肢をパース
    const options: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const optMatch = parts[i].match(/^(\d+)\.\s*([\s\S]*)/);
      if (optMatch) {
        options.push(optMatch[2].trim());
      }
    }

    results.push({
      number: qNum,
      text: questionText,
      optionA: options[0] || "",
      optionB: options[1] || "",
      optionC: options[2] || null,
      optionD: options[3] || null,
    });
  }

  return results;
}

/**
 * 解答.md を解析して正解マップを取得
 */
function parseAnswersMd(content: string): Map<number, string> {
  const answers = new Map<number, string>();

  // テーブル行を解析: | 問N | X |
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/\|\s*問(\d+)\s*\|\s*(\d+)\s*\|/);
    if (match) {
      const qNum = parseInt(match[1], 10);
      const answerNum = match[2];
      const answerAlpha = NUM_TO_ALPHA[answerNum] || answerNum;
      answers.set(qNum, answerAlpha);
    }
  }

  return answers;
}

/**
 * 解説.md を解析して解説マップを取得
 */
function parseExplanationsMd(content: string): Map<number, string> {
  const explanations = new Map<number, string>();

  // 前処理: 1行ファイル対策
  content = content.replace(/## 問(\d+)/g, (match, digits: string) => {
    if (digits.length >= 2) {
      const twoDigit = parseInt(digits.substring(0, 2), 10);
      if (twoDigit >= 10 && twoDigit <= 60) {
        return `\n## 問${twoDigit}\n${digits.substring(2)}`;
      }
    }
    const oneDigit = parseInt(digits.substring(0, 1), 10);
    if (oneDigit >= 1 && oneDigit <= 9) {
      return `\n## 問${oneDigit}\n${digits.substring(1)}`;
    }
    return match;
  });

  // ## 問N で分割
  const blocks = content.split(/(?=## 問\d+)/);

  for (const block of blocks) {
    const headerMatch = block.match(/^## 問(\d+)/);
    if (!headerMatch) continue;

    const qNum = parseInt(headerMatch[1], 10);
    const body = block.replace(/^## 問\d+\s*/, "").trim();
    explanations.set(qNum, body);
  }

  return explanations;
}

/**
 * Markdown内の画像パスを書き換え、画像ファイルをコピー
 */
function processImages(
  text: string,
  sourceDir: string,
  destDir: string,
  copyPromises: Promise<void>[],
): string {
  if (!text) return text;

  // ![alt](問題XX.png) または ![alt](問題XX_Y.png) 形式を検出
  const regex = /!\[([^\]]*)\]\(([^)]+\.png)\)/g;

  return text.replace(regex, (match, alt, imagePath) => {
    const filename = path.basename(imagePath);
    const sourcePath = path.join(sourceDir, filename);
    const destPath = path.join(destDir, filename);

    if (fs.existsSync(sourcePath)) {
      copyPromises.push(fs.promises.copyFile(sourcePath, destPath));
    } else {
      console.warn(`  ⚠️ 画像未検出: ${sourcePath}`);
    }

    // 公開用パスに書き換え
    const publicPath = destDir
      .split(path.sep)
      .join("/")
      .replace(/.*public/, "");
    return `![${alt}](${publicPath}/${filename})`;
  });
}

// ── メイン処理 ──

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("❌ 使い方: npx tsx scripts/import-fp-md.ts <examSlug> [folderFilter]");
    console.error("  例: npx tsx scripts/import-fp-md.ts fp2-gakka");
    process.exit(1);
  }

  const [examSlug, folderFilter] = args;
  const folderName = SLUG_TO_FOLDER[examSlug];
  if (!folderName) {
    console.error(`❌ 不明なスラッグ: ${examSlug}`);
    console.error(`  利用可能: ${Object.keys(SLUG_TO_FOLDER).join(", ")}`);
    process.exit(1);
  }

  const rawDataDir = path.join(process.cwd(), "rawData", "FP", folderName);
  if (!fs.existsSync(rawDataDir)) {
    console.error(`❌ フォルダが見つかりません: ${rawDataDir}`);
    process.exit(1);
  }

  // 1. 試験情報の取得
  const [exam] = await db
    .select({ id: exams.id, title: exams.title })
    .from(exams)
    .where(eq(exams.slug, examSlug));

  if (!exam) {
    console.error(`❌ 試験が見つかりません: slug=${examSlug}`);
    console.error("  先に scripts/init-exams.ts を実行してください。");
    process.exit(1);
  }

  console.log(`🚀 インポート開始: ${exam.title} (id=${exam.id})`);
  console.log(`📁 ソース: ${rawDataDir}\n`);

  // 2. 年度フォルダの一覧取得（ソート済み）
  let yearFolders = fs
    .readdirSync(rawDataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{6}$/.test(d.name))
    .map((d) => d.name)
    .sort();

  if (folderFilter) {
    yearFolders = yearFolders.filter((f) => f === folderFilter);
    if (yearFolders.length === 0) {
      console.error(`❌ 指定フォルダが見つかりません: ${folderFilter}`);
      process.exit(1);
    }
  }

  console.log(`📅 対象年度: ${yearFolders.join(", ")}\n`);

  // 全年度を通した連番カウンター（セクション割り当て用）
  let globalQuestionIndex = 0;
  let totalInsertCount = 0;
  let totalUpdateCount = 0;
  const copyPromises: Promise<void>[] = [];

  for (const yearFolder of yearFolders) {
    const yearDir = path.join(rawDataDir, yearFolder);
    console.log(`── ${yearFolder} ──`);

    // ファイルの存在チェック
    const questionFile = path.join(yearDir, "問題.md");
    const answerFile = path.join(yearDir, "解答.md");
    const explanationFile = path.join(yearDir, "解説.md");

    if (!fs.existsSync(questionFile)) {
      console.warn(`  ⚠️ 問題.md が見つかりません。スキップ`);
      continue;
    }
    if (!fs.existsSync(answerFile)) {
      console.warn(`  ⚠️ 解答.md が見つかりません。スキップ`);
      continue;
    }

    // 3. MDファイルの解析
    const questionsData = parseQuestionsMd(
      fs.readFileSync(questionFile, "utf-8"),
    );
    const answersMap = parseAnswersMd(fs.readFileSync(answerFile, "utf-8"));
    const explanationsMap = fs.existsSync(explanationFile)
      ? parseExplanationsMd(fs.readFileSync(explanationFile, "utf-8"))
      : new Map<number, string>();

    console.log(
      `  📊 問題: ${questionsData.length}件, 正解: ${answersMap.size}件, 解説: ${explanationsMap.size}件`,
    );

    // 4. ExamYear の取得・作成
    const yearNum = parseInt(yearFolder.substring(0, 4), 10);
    const monthStr = yearFolder.substring(4, 6);
    const season = MONTH_TO_SEASON[monthStr];

    if (!season) {
      console.warn(`  ⚠️ 不明な月: ${monthStr}。スキップ`);
      continue;
    }

    const seasonLabelMap: Record<string, string> = {
      jan: "1月",
      may: "5月",
      sep: "9月",
    };
    const label = `${yearNum}年${seasonLabelMap[season]}`;

    let examYearId: number;
    const [existingExamYear] = await db
      .select({ id: examYears.id })
      .from(examYears)
      .where(
        and(
          eq(examYears.examId, exam.id),
          eq(examYears.year, yearNum),
          eq(examYears.season, season),
        ),
      );

    if (existingExamYear) {
      examYearId = existingExamYear.id;
      console.log(`  ✅ 年度取得: ${label} (id=${examYearId})`);
    } else {
      const [newExamYear] = await db
        .insert(examYears)
        .values({ examId: exam.id, year: yearNum, season, label })
        .returning({ id: examYears.id });
      examYearId = newExamYear.id;
      console.log(`  ✅ 年度作成: ${label} (id=${examYearId})`);
    }

    // 5. 画像コピー先ディレクトリ
    const imageFolderName = `${examSlug}_${yearFolder}`;
    const publicImagesDir = path.join(
      process.cwd(),
      "public",
      "images",
      "kakomon",
      imageFolderName,
    );
    if (!fs.existsSync(publicImagesDir)) {
      fs.mkdirSync(publicImagesDir, { recursive: true });
    }

    // 6. 問題の登録
    let insertCount = 0;
    let updateCount = 0;

    for (const q of questionsData) {
      globalQuestionIndex++;

      // セクション割り当て（5問ずつ）
      const sectionIndex =
        Math.floor((globalQuestionIndex - 1) / QUESTIONS_PER_SECTION) + 1;
      const sectionTitle = `#${sectionIndex}`;

      // セクションの取得・作成
      let sectionId: number;
      const [existingSection] = await db
        .select({ id: sections.id })
        .from(sections)
        .where(
          and(
            eq(sections.examId, exam.id),
            eq(sections.title, sectionTitle),
          ),
        );

      if (existingSection) {
        sectionId = existingSection.id;
      } else {
        const startQ = (sectionIndex - 1) * QUESTIONS_PER_SECTION + 1;
        const endQ = sectionIndex * QUESTIONS_PER_SECTION;
        const [newSection] = await db
          .insert(sections)
          .values({
            examId: exam.id,
            title: sectionTitle,
            description: `問${startQ}〜${endQ}`,
            order: sectionIndex,
          })
          .returning({ id: sections.id });
        sectionId = newSection.id;
      }

      // 画像パスの変換
      const qText = processImages(
        q.text,
        yearDir,
        publicImagesDir,
        copyPromises,
      );
      const optA = processImages(
        q.optionA,
        yearDir,
        publicImagesDir,
        copyPromises,
      );
      const optB = processImages(
        q.optionB,
        yearDir,
        publicImagesDir,
        copyPromises,
      );
      const optC = q.optionC
        ? processImages(q.optionC, yearDir, publicImagesDir, copyPromises)
        : null;
      const optD = q.optionD
        ? processImages(q.optionD, yearDir, publicImagesDir, copyPromises)
        : null;

      const explanation = explanationsMap.get(q.number) || null;
      const expProcessed = explanation
        ? processImages(explanation, yearDir, publicImagesDir, copyPromises)
        : null;

      const correctAnswer = answersMap.get(q.number) || "A";
      const hasImage = [qText, optA, optB, optC, optD, expProcessed].some(
        (t) => t && t.includes("/images/kakomon/"),
      );

      const questionCommon = {
        sectionId,
        questionText: qText,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer,
        explanation: expProcessed,
        order: globalQuestionIndex,
        examYearId,
        questionNumber: q.number,
        hasImage,
        sourceNote: `${label} 問${q.number}`,
      };

      // 既存チェック（重複防止）
      const [existing] = await db
        .select({ id: questions.id })
        .from(questions)
        .where(
          and(
            eq(questions.examYearId, examYearId),
            eq(questions.questionNumber, q.number),
          ),
        );

      if (existing) {
        await db
          .update(questions)
          .set(questionCommon)
          .where(eq(questions.id, existing.id));
        updateCount++;
      } else {
        await db.insert(questions).values(questionCommon);
        insertCount++;
      }
    }

    totalInsertCount += insertCount;
    totalUpdateCount += updateCount;
    console.log(`  📝 新規: ${insertCount}件, 更新: ${updateCount}件\n`);
  }

  // 画像コピー待ち
  await Promise.all(copyPromises);

  console.log(`\n🎉 インポート完了!`);
  console.log(`  - 合計新規: ${totalInsertCount}件`);
  console.log(`  - 合計更新: ${totalUpdateCount}件`);
  console.log(`  - 画像コピー: ${copyPromises.length}件`);
  console.log(
    `  - セクション数: ${Math.ceil(globalQuestionIndex / QUESTIONS_PER_SECTION)}`,
  );
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
