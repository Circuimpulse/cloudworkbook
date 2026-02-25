/**
 * IPA AP午前 過去問PDF解析スクリプト
 *
 * 使い方:
 *   tsx scripts/parse-pdf.ts <pdfファイルパス> [オプション]
 *
 * オプション:
 *   --output <パス>       出力CSVファイルパス (デフォルト: IPA_kakomon/<元ファイル名>.csv)
 *   --year <年>           年度 (例: 2024)
 *   --season <spring|autumn>  春秋 (デフォルト: 自動検出)
 *   --category1 <名前>    大分類デフォルト値 (デフォルト: "テクノロジ系")
 *
 * 対応PDFフォーマット:
 *   IPA公式の過去問PDFおよび解答・解説PDFを想定。
 *   問題PDFと解答PDFを別々に処理し、CSVに統合することを推奨。
 *
 * 注意:
 *   図表を含む問題は hasImage フラグが立ちますが、画像URLは手動で設定が必要です。
 *   複雑な図表や数式が含まれる問題は questionText に "[図表あり]" が付与されます。
 */

import * as fs from "fs";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number }>;
import * as Papa from "papaparse";

interface ParsedQuestion {
  questionNumber: number;
  year: number;
  season: string;
  categoryLevel1: string;
  categoryLevel2: string;
  categoryLevel3: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  imageUrl: string;
  sourceNote: string;
  hasImage: boolean;
}

// IPA AP午前の問題パターン
// 例: "問1" or "問 1" で始まる行
const QUESTION_START_RE = /^問\s*(\d+)/;

// 選択肢パターン: ア, イ, ウ, エ (IPA標準) または ア), イ), ウ), エ)
const OPTION_RE = /^([アイウエ])[）\)]\s*(.+)/;
// 英字選択肢: ア〜エ の代わりに a〜d や A〜D を使う場合
const OPTION_EN_RE = /^([a-dA-D])[）\)\.\s]\s*(.+)/;

// 解答パターン: "正解：ウ" or "答：イ" or "解答 ウ"
const ANSWER_RE = /(?:正解|解答|答)[：:]\s*([アイウエa-dA-D])/;

// 図表を示すキーワード
const IMAGE_KEYWORDS = [
  "図",
  "表",
  "グラフ",
  "チャート",
  "ダイアグラム",
  "フローチャート",
  "画像",
];

// ア〜エ を A〜D に変換
function kanaToLetter(kana: string): string {
  const map: Record<string, string> = {
    ア: "A",
    イ: "B",
    ウ: "C",
    エ: "D",
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
  };
  return map[kana] || kana;
}

function detectSeason(text: string, filename: string): "spring" | "autumn" {
  const combined = text + filename;
  if (/春|spring|4月|April/i.test(combined)) return "spring";
  if (/秋|autumn|fall|10月|October/i.test(combined)) return "autumn";
  // ファイル名から推測: r6h = 令和6年春, r6a = 令和6年秋
  if (/[rR]\d+[hH]/.test(filename)) return "spring";
  if (/[rR]\d+[aA]/.test(filename)) return "autumn";
  return "autumn";
}

function detectYear(text: string, filename: string): number {
  // 令和X年
  const reiwaMatch = text.match(/令和\s*(\d+)\s*年/);
  if (reiwaMatch) return 2018 + parseInt(reiwaMatch[1]);

  // 平成X年
  const heiseiMatch = text.match(/平成\s*(\d+)\s*年/);
  if (heiseiMatch) return 1988 + parseInt(heiseiMatch[1]);

  // ファイル名から: r6 = 令和6年 = 2024
  const fileReiwa = filename.match(/[rR](\d+)/);
  if (fileReiwa) return 2018 + parseInt(fileReiwa[1]);

  // 西暦
  const seirekiMatch = text.match(/20(\d{2})\s*年/);
  if (seirekiMatch) return 2000 + parseInt(seirekiMatch[1]);

  return new Date().getFullYear();
}

function hasImageContent(text: string): boolean {
  return IMAGE_KEYWORDS.some((kw) => text.includes(kw));
}

function parseQuestionsFromText(
  text: string,
  year: number,
  season: string,
  defaultCategory1: string,
): ParsedQuestion[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: ParsedQuestion[] = [];
  let current: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  let inQuestion = false;
  let textBuffer: string[] = [];

  const saveQuestion = () => {
    if (!current || !current.questionNumber) return;

    // オプションが足りない場合は空文字
    const [optA = "", optB = "", optC = "", optD = ""] = currentOptions;

    const qText = textBuffer.join(" ").trim();
    const imageFlag = hasImageContent(qText);

    questions.push({
      questionNumber: current.questionNumber,
      year,
      season,
      categoryLevel1: current.categoryLevel1 || defaultCategory1,
      categoryLevel2: current.categoryLevel2 || "未分類",
      categoryLevel3: current.categoryLevel3 || "",
      questionText: imageFlag ? `[図表あり] ${qText}` : qText,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: current.correctAnswer || "",
      explanation: current.explanation || "",
      imageUrl: "",
      sourceNote: `${year}年${season === "spring" ? "春" : "秋"} 問${current.questionNumber}`,
      hasImage: imageFlag,
    });
  };

  for (const line of lines) {
    const qMatch = line.match(QUESTION_START_RE);
    if (qMatch) {
      if (current) saveQuestion();

      current = {
        questionNumber: parseInt(qMatch[1], 10),
        categoryLevel1: defaultCategory1,
      };
      currentOptions = [];
      textBuffer = [line.replace(QUESTION_START_RE, "").trim()];
      inQuestion = true;
      continue;
    }

    if (!inQuestion || !current) continue;

    // 選択肢（ア〜エ）
    const optKanaMatch = line.match(OPTION_RE);
    if (optKanaMatch) {
      currentOptions.push(optKanaMatch[2].trim());
      continue;
    }

    // 選択肢（英字）
    const optEnMatch = line.match(OPTION_EN_RE);
    if (optEnMatch) {
      currentOptions.push(optEnMatch[2].trim());
      continue;
    }

    // 解答
    const ansMatch = line.match(ANSWER_RE);
    if (ansMatch) {
      current.correctAnswer = kanaToLetter(ansMatch[1]);
      continue;
    }

    // 解説（"解説" や "【解説】" で始まる行以降）
    if (/^(?:解説|【解説】|■解説)/.test(line)) {
      current.explanation = line
        .replace(/^(?:解説|【解説】|■解説)[：:\s]*/, "")
        .trim();
      continue;
    }

    // 問題文の続き（選択肢が始まる前）
    if (currentOptions.length === 0) {
      textBuffer.push(line);
    } else if (current.explanation !== undefined) {
      // 解説の続き
      current.explanation += " " + line;
    }
  }

  if (current) saveQuestion();

  return questions;
}

async function parsePdf(
  pdfPath: string,
  options: {
    outputPath?: string;
    year?: number;
    season?: string;
    category1?: string;
  } = {},
) {
  const absolutePath = path.resolve(pdfPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  console.log(`📄 Parsing PDF: ${path.basename(absolutePath)}`);

  const dataBuffer = fs.readFileSync(absolutePath);
  const pdfData = await pdfParse(dataBuffer);

  const filename = path.basename(absolutePath, path.extname(absolutePath));
  const text = pdfData.text;

  const year = options.year || detectYear(text, filename);
  const season = options.season || detectSeason(text, filename);
  const category1 = options.category1 || "テクノロジ系";

  console.log(`  📅 Year: ${year}, Season: ${season}`);
  console.log(`  📝 Total pages: ${pdfData.numpages}`);
  console.log(`  📝 Text length: ${text.length} chars`);

  const parsed = parseQuestionsFromText(text, year, season, category1);

  console.log(`  ✅ Parsed ${parsed.length} questions`);

  const imageFlagged = parsed.filter((q: ParsedQuestion) => q.hasImage).length;
  if (imageFlagged > 0) {
    console.log(
      `  ⚠️  ${imageFlagged} questions flagged as containing figures/tables (imageUrl requires manual input)`,
    );
  }

  const emptyAnswer = parsed.filter(
    (q: ParsedQuestion) => !q.correctAnswer,
  ).length;
  if (emptyAnswer > 0) {
    console.log(
      `  ⚠️  ${emptyAnswer} questions have no correctAnswer (check answer PDF or fill manually)`,
    );
  }

  // CSV出力
  const defaultOutput = path.join(
    path.dirname(absolutePath),
    `${filename}.csv`,
  );
  const outputPath = options.outputPath
    ? path.resolve(options.outputPath)
    : defaultOutput;

  const csvContent = Papa.unparse(
    parsed.map((q: ParsedQuestion) => ({
      questionNumber: q.questionNumber,
      year: q.year,
      season: q.season,
      categoryLevel1: q.categoryLevel1,
      categoryLevel2: q.categoryLevel2,
      categoryLevel3: q.categoryLevel3,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      imageUrl: q.imageUrl,
      sourceNote: q.sourceNote,
    })),
    { header: true },
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, "\uFEFF" + csvContent, "utf-8"); // BOM付きUTF-8

  console.log(`\n✅ CSV output: ${outputPath}`);
  console.log(
    `\n次のステップ: tsx scripts/import-csv.ts "${outputPath}" でDBにインポートしてください`,
  );
}

// CLI引数パース
const args = process.argv.slice(2);
const pdfPath = args[0];

if (!pdfPath) {
  console.error(
    "Usage: tsx scripts/parse-pdf.ts <pdfファイルパス> [--output <出力パス>] [--year <年>] [--season <spring|autumn>] [--category1 <大分類>]",
  );
  process.exit(1);
}

const opts: {
  outputPath?: string;
  year?: number;
  season?: string;
  category1?: string;
} = {};

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--output" && args[i + 1]) opts.outputPath = args[++i];
  else if (args[i] === "--year" && args[i + 1]) opts.year = parseInt(args[++i]);
  else if (args[i] === "--season" && args[i + 1]) opts.season = args[++i];
  else if (args[i] === "--category1" && args[i + 1]) opts.category1 = args[++i];
}

parsePdf(pdfPath, opts)
  .catch((err) => {
    console.error("❌ Parse failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
