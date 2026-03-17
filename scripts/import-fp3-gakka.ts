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
    if (!process.env[key]) process.env[key] = value;
  }
}

import { db } from "../src/backend/db/client";
import { exams, examYears, sections, questions } from "../src/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * FP3級座学インポートスクリプト
 *
 * 3形式に自動対応:
 * A: ## 第1問 / ## 第2問 形式（202305等）
 * B: 【第1問】/ 【第2問】形式（202309/202401）
 * C: ## 問N + > **正解**: 形式（202405/202505）— 解答.md不要
 */

const EXAM_SLUG = "fp3-gakka";
const QUESTIONS_PER_SECTION = 5;

const MONTH_TO_SEASON: Record<string, "jan" | "may" | "sep"> = {
  "01": "jan", "05": "may", "09": "sep",
};
const CIRCLE_NUM: Record<string, number> = {
  "①": 1, "②": 2, "③": 3, "④": 4,
};

interface ParsedQuestion {
  number: number;
  text: string;
  type: "true_false" | "choice";
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
}

interface ParseResult {
  questions: ParsedQuestion[];
  embeddedAnswers: Map<number, string>;
}

// ── パーサー ──

function parseQuestionsMd(content: string): ParseResult {
  // 形式判別
  if (content.includes("> **正解**:")) {
    return parseFormatC(content);
  }
  return parseFormatAB(content);
}

/** 形式A/B: ## 第1問/【第1問】+ (N) 形式 */
function parseFormatAB(content: string): ParseResult {
  const results: ParsedQuestion[] = [];

  // 前処理: 1行ファイル対策（【第N問】の前に改行のみ挿入）
  content = content.replace(/(?<=\S)(【第\d+問】)/g, "\n$1");
  content = content.replace(/(?<=\S)(## 第\d+問)/g, "\n$1");

  const part1Regex = /(?:## 第1問|【第1問】)([\s\S]*?)(?=(?:## 第2問|【第2問】))/;
  const part2Regex = /(?:## 第2問|【第2問】)([\s\S]*)/;

  // 第1問: ○×問題 (1)〜(30)
  const tfMatch = content.match(part1Regex);
  if (tfMatch) {
    for (const qBlock of tfMatch[1].split(/(?=^\(\d+\))/m)) {
      const hdr = qBlock.match(/^\((\d+)\)\s*([\s\S]*)/);
      if (!hdr) continue;
      const qNum = parseInt(hdr[1], 10);
      const qText = hdr[2].trim();
      if (!qText) continue;
      results.push({ number: qNum, text: qText, type: "true_false",
        optionA: "正しい（適切）", optionB: "誤り（不適切）", optionC: null, optionD: null });
    }
  }

  // 第2問: 3択問題 (31)〜(60)
  const cMatch = content.match(part2Regex);
  if (cMatch) {
    for (const qBlock of cMatch[1].split(/(?=^\(\d+\))/m)) {
      const hdr = qBlock.match(/^\((\d+)\)\s*([\s\S]*)/);
      if (!hdr) continue;
      const qNum = parseInt(hdr[1], 10);
      if (qNum < 31) continue;
      const parts = hdr[2].split(/(?=\d\)\s)/);
      if (parts.length < 2) {
        results.push({ number: qNum, text: hdr[2].trim(), type: "choice",
          optionA: "", optionB: "", optionC: null, optionD: null });
        continue;
      }
      const options = parts.slice(1).map(p => {
        const m = p.match(/^\d\)\s*([\s\S]*)/);
        return m ? m[1].trim() : "";
      });
      results.push({ number: qNum, text: parts[0].trim(), type: "choice",
        optionA: options[0] || "", optionB: options[1] || "",
        optionC: options[2] || null, optionD: null });
    }
  }

  return { questions: results, embeddedAnswers: new Map() };
}

/** 形式C: ## 問N + > **正解**: ○/×/N) 形式 */
function parseFormatC(content: string): ParseResult {
  const results: ParsedQuestion[] = [];
  const embeddedAnswers = new Map<number, string>();

  // 前処理: ## 問N と > **正解** の前に改行挿入
  content = content.replace(/## 問(\d+)/g, (match, digits: string) => {
    if (digits.length >= 2) {
      const two = parseInt(digits.substring(0, 2), 10);
      if (two >= 10 && two <= 60) return `\n## 問${two}\n${digits.substring(2)}`;
    }
    const one = parseInt(digits.substring(0, 1), 10);
    if (one >= 1 && one <= 9) return `\n## 問${one}\n${digits.substring(1)}`;
    return match;
  });
  content = content.replace(/(?<=\S)(> \*\*正解\*\*)/g, "\n$1");
  content = content.replace(/(?<=\S)(\d\))\s/g, "\n$1 ");

  for (const block of content.split(/(?=## 問\d+)/)) {
    const hdr = block.match(/^## 問(\d+)/);
    if (!hdr) continue;
    const qNum = parseInt(hdr[1], 10);
    let body = block.replace(/^## 問\d+\s*/, "").trim();

    // 正解を抽出
    const ansMatch = body.match(/>\s*\*\*正解\*\*:\s*(.+)/);
    if (ansMatch) {
      const raw = ansMatch[1].trim();
      body = body.replace(/>\s*\*\*正解\*\*:\s*.+/, "").trim();
      if (raw === "○") embeddedAnswers.set(qNum, "A");
      else if (raw === "×") embeddedAnswers.set(qNum, "B");
      else {
        const nm = raw.match(/^(\d)\)/);
        if (nm) {
          const map: Record<string, string> = { "1": "A", "2": "B", "3": "C" };
          embeddedAnswers.set(qNum, map[nm[1]] || raw);
        } else embeddedAnswers.set(qNum, raw);
      }
    }

    if (qNum <= 30) {
      results.push({ number: qNum, text: body, type: "true_false",
        optionA: "正しい（適切）", optionB: "誤り（不適切）", optionC: null, optionD: null });
    } else {
      const parts = body.split(/(?=\d\)\s)/);
      if (parts.length < 2) {
        results.push({ number: qNum, text: body.trim(), type: "choice",
          optionA: "", optionB: "", optionC: null, optionD: null });
      } else {
        const options = parts.slice(1).map(p => {
          const m = p.match(/^\d\)\s*([\s\S]*)/);
          return m ? m[1].trim() : "";
        });
        results.push({ number: qNum, text: parts[0].trim(), type: "choice",
          optionA: options[0] || "", optionB: options[1] || "",
          optionC: options[2] || null, optionD: null });
      }
    }
  }

  return { questions: results, embeddedAnswers };
}

/** 解答.md を解析 */
function parseAnswersMd(content: string): Map<number, string> {
  const answers = new Map<number, string>();
  for (const line of content.split("\n")) {
    const match = line.match(/\|\s*問(\d+)\s*\|\s*([①②③④\d]+)\s*\|/);
    if (!match) continue;
    const qNum = parseInt(match[1], 10);
    const raw = match[2].trim();
    const circleVal = CIRCLE_NUM[raw];
    if (circleVal) {
      const map: Record<number, string> = { 1: "A", 2: "B", 3: "C", 4: "D" };
      answers.set(qNum, map[circleVal] || raw);
    } else {
      const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
      answers.set(qNum, map[raw] || raw);
    }
  }
  return answers;
}

/** 解説.md を解析 */
function parseExplanationsMd(content: string): Map<number, string> {
  const explanations = new Map<number, string>();
  // (N) 形式
  for (const block of content.split(/(?=\(\d+\)\s)/)) {
    const hdr = block.match(/^\((\d+)\)\s+([\s\S]*)/);
    if (!hdr) continue;
    explanations.set(parseInt(hdr[1], 10), hdr[2].trim());
  }
  // ## 問N 形式（fallback）
  if (explanations.size === 0) {
    content = content.replace(/## 問(\d+)/g, (match, digits: string) => {
      if (digits.length >= 2) {
        const two = parseInt(digits.substring(0, 2), 10);
        if (two >= 10 && two <= 60) return `\n## 問${two}\n${digits.substring(2)}`;
      }
      const one = parseInt(digits.substring(0, 1), 10);
      if (one >= 1 && one <= 9) return `\n## 問${one}\n${digits.substring(1)}`;
      return match;
    });
    for (const block of content.split(/(?=## 問\d+)/)) {
      const hdr = block.match(/^## 問(\d+)/);
      if (!hdr) continue;
      explanations.set(parseInt(hdr[1], 10), block.replace(/^## 問\d+\s*/, "").trim());
    }
  }
  return explanations;
}

/** 画像パス処理 */
function processImages(text: string, srcDir: string, destDir: string, copies: Promise<void>[]): string {
  if (!text) return text;
  return text.replace(/!\[([^\]]*)\]\(([^)]+\.png)\)/g, (_, alt, imgPath) => {
    const fn = path.basename(imgPath);
    const src = path.join(srcDir, fn);
    const dst = path.join(destDir, fn);
    if (fs.existsSync(src)) copies.push(fs.promises.copyFile(src, dst));
    const pubPath = destDir.split(path.sep).join("/").replace(/.*public/, "");
    return `![${alt}](${pubPath}/${fn})`;
  });
}

// ── メイン ──
async function main() {
  const folderFilter = process.argv[2];

  const [exam] = await db.select({ id: exams.id, title: exams.title })
    .from(exams).where(eq(exams.slug, EXAM_SLUG));
  if (!exam) { console.error(`❌ slug=${EXAM_SLUG} not found`); process.exit(1); }

  await db.update(exams).set({ questionFormat: "mixed" }).where(eq(exams.id, exam.id));

  const rawDataDir = path.join(process.cwd(), "rawData", "FP", "FP3級座学");
  console.log(`🚀 インポート開始: ${exam.title} (id=${exam.id})`);
  console.log(`📁 ソース: ${rawDataDir}\n`);

  let yearFolders = fs.readdirSync(rawDataDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{6}$/.test(d.name))
    .map(d => d.name).sort();
  if (folderFilter) yearFolders = yearFolders.filter(f => f === folderFilter);
  console.log(`📅 対象年度: ${yearFolders.join(", ")}\n`);

  let globalIdx = 0, totalInsert = 0;
  const copies: Promise<void>[] = [];
  const seasonLabel: Record<string, string> = { jan: "1月", may: "5月", sep: "9月" };

  for (const yf of yearFolders) {
    const yearDir = path.join(rawDataDir, yf);
    console.log(`── ${yf} ──`);

    const qFile = path.join(yearDir, "問題.md");
    const aFile = path.join(yearDir, "解答.md");
    const eFile = path.join(yearDir, "解説.md");

    if (!fs.existsSync(qFile)) { console.warn(`  ⚠️ 問題.mdなし。スキップ`); continue; }

    const parseResult = parseQuestionsMd(fs.readFileSync(qFile, "utf-8"));
    const questionsData = parseResult.questions;

    // 正解: 埋め込みがあればそれを優先、なければ解答.mdを読む
    let answersMap: Map<number, string>;
    if (parseResult.embeddedAnswers.size > 0) {
      answersMap = parseResult.embeddedAnswers;
      console.log(`  📋 正解埋め込み形式を検出 (${answersMap.size}件)`);
    } else if (fs.existsSync(aFile)) {
      answersMap = parseAnswersMd(fs.readFileSync(aFile, "utf-8"));
    } else {
      console.warn(`  ⚠️ 解答.mdなし＆埋め込み正解なし。スキップ`);
      continue;
    }

    const explanationsMap = fs.existsSync(eFile)
      ? parseExplanationsMd(fs.readFileSync(eFile, "utf-8"))
      : new Map<number, string>();

    console.log(`  📊 問題: ${questionsData.length}件, 正解: ${answersMap.size}件, 解説: ${explanationsMap.size}件`);

    const yearNum = parseInt(yf.substring(0, 4), 10);
    const season = MONTH_TO_SEASON[yf.substring(4, 6)];
    if (!season) { console.warn(`  ⚠️ 不明な月`); continue; }
    const label = `${yearNum}年${seasonLabel[season]}`;

    let examYearId: number;
    const [ey] = await db.select({ id: examYears.id }).from(examYears)
      .where(and(eq(examYears.examId, exam.id), eq(examYears.year, yearNum), eq(examYears.season, season)));
    if (ey) { examYearId = ey.id; }
    else {
      const [ny] = await db.insert(examYears)
        .values({ examId: exam.id, year: yearNum, season, label })
        .returning({ id: examYears.id });
      examYearId = ny.id;
    }

    const imgDir = path.join(process.cwd(), "public", "images", "kakomon", `${EXAM_SLUG}_${yf}`);
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    let insertCount = 0;
    for (const q of questionsData) {
      globalIdx++;
      const secIdx = Math.floor((globalIdx - 1) / QUESTIONS_PER_SECTION) + 1;
      const secTitle = `#${secIdx}`;

      let sectionId: number;
      const [es] = await db.select({ id: sections.id }).from(sections)
        .where(and(eq(sections.examId, exam.id), eq(sections.title, secTitle)));
      if (es) { sectionId = es.id; }
      else {
        const perYearSecIdx = Math.floor((q.number - 1) / QUESTIONS_PER_SECTION) + 1;
        const s = (perYearSecIdx - 1) * QUESTIONS_PER_SECTION + 1;
        const e = perYearSecIdx * QUESTIONS_PER_SECTION;
        const [ns] = await db.insert(sections)
          .values({ examId: exam.id, title: secTitle, description: `${label} 問${s}〜${e}`, order: secIdx })
          .returning({ id: sections.id });
        sectionId = ns.id;
      }

      const qText = processImages(q.text, yearDir, imgDir, copies);
      const exp = explanationsMap.get(q.number) || null;
      const expP = exp ? processImages(exp, yearDir, imgDir, copies) : null;
      const correct = answersMap.get(q.number) || "A";
      const hasImage = [qText, expP].some(t => t && t.includes("/images/kakomon/"));

      const vals = {
        sectionId, questionText: qText,
        questionType: q.type as "choice" | "true_false",
        optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
        correctAnswer: correct, explanation: expP,
        order: globalIdx, examYearId, questionNumber: q.number,
        hasImage, sourceNote: `${label} 問${q.number}`,
      };

      const [ex] = await db.select({ id: questions.id }).from(questions)
        .where(and(eq(questions.examYearId, examYearId), eq(questions.questionNumber, q.number)));
      if (ex) { await db.update(questions).set(vals).where(eq(questions.id, ex.id)); }
      else { await db.insert(questions).values(vals); insertCount++; }
    }

    totalInsert += insertCount;
    console.log(`  📝 新規: ${insertCount}件\n`);
  }

  await Promise.all(copies);
  console.log(`\n🎉 インポート完了!`);
  console.log(`  - 合計: ${totalInsert}件`);
  console.log(`  - 画像コピー: ${copies.length}件`);
  console.log(`  - セクション数: ${Math.ceil(globalIdx / QUESTIONS_PER_SECTION)}`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
