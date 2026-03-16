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
 * FP3級実技インポートスクリプト
 * 20問/3択のみ。## 問N 形式。画像つき問題が多い。
 */

const EXAM_SLUG = "fp3-jitsugi";
const QUESTIONS_PER_SECTION = 5;

const MONTH_TO_SEASON: Record<string, "jan" | "may" | "sep"> = {
  "01": "jan", "05": "may", "09": "sep",
};

interface ParsedQuestion {
  number: number;
  text: string;
  options: string[];
}

/** 問題.md をパース（## 問N 形式） */
function parseQuestionsMd(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  // ## 問N で分割
  const parts = content.split(/^## 問(\d+)/m);
  // parts: [prefix, "1", q1body, "2", q2body, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const qNum = parseInt(parts[i], 10);
    const body = parts[i + 1];
    if (!body) continue;

    // 選択肢を抽出（行頭の "1." "2." "3." パターン）
    const lines = body.trim().split("\n");
    const optionLines: string[] = [];
    const textLines: string[] = [];
    let inOptions = false;

    for (const line of lines) {
      const trimLine = line.trim();
      if (/^[1-3]\.\s/.test(trimLine)) {
        inOptions = true;
        optionLines.push(trimLine.replace(/^[1-3]\.\s*/, ""));
      } else if (inOptions && trimLine.length > 0) {
        // 選択肢の続き行
        optionLines[optionLines.length - 1] += " " + trimLine;
      } else {
        if (!inOptions) textLines.push(line);
      }
    }

    questions.push({
      number: qNum,
      text: textLines.join("\n").trim(),
      options: optionLines,
    });
  }
  return questions;
}

/** 解答.md をパース */
function parseAnswersMd(content: string): Map<number, string> {
  const map = new Map<number, string>();
  const lines = content.split("\n");
  for (const line of lines) {
    const m = line.match(/\|\s*問(\d+)\s*\|\s*(\d+)\s*\|/);
    if (m) map.set(parseInt(m[1], 10), m[2]);
  }
  return map;
}

/** 解説.md をパース */
function parseExplanationsMd(content: string): Map<number, string> {
  const map = new Map<number, string>();
  const parts = content.split(/^## 問(\d+)/m);
  for (let i = 1; i < parts.length; i += 2) {
    const qNum = parseInt(parts[i], 10);
    map.set(qNum, parts[i + 1]?.trim() || "");
  }
  return map;
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

  // exam レコード確認/作成
  let [exam] = await db.select({ id: exams.id, title: exams.title })
    .from(exams).where(eq(exams.slug, EXAM_SLUG));
  if (!exam) {
    console.log("📌 FP3級実技試験の exam レコードを作成...");
    const [newExam] = await db.insert(exams)
      .values({
        title: "FP3級 実技試験",
        description: "ファイナンシャル・プランニング技能検定3級 実技試験",
        slug: EXAM_SLUG,
        questionFormat: "choice_only",
      })
      .returning({ id: exams.id, title: exams.title });
    exam = newExam;
  }

  const rawDataDir = path.join(process.cwd(), "rawData", "FP", "FP3級実技");
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

    const questionsData = parseQuestionsMd(fs.readFileSync(qFile, "utf-8"));
    const answersMap = fs.existsSync(aFile)
      ? parseAnswersMd(fs.readFileSync(aFile, "utf-8"))
      : new Map<number, string>();
    const explanationsMap = fs.existsSync(eFile)
      ? parseExplanationsMd(fs.readFileSync(eFile, "utf-8"))
      : new Map<number, string>();

    console.log(`  📊 問題: ${questionsData.length}件, 正解: ${answersMap.size}件, 解説: ${explanationsMap.size}件`);

    if (answersMap.size === 0) {
      console.warn(`  ⚠️ 解答なし。スキップ`);
      continue;
    }

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
        const s = (secIdx - 1) * QUESTIONS_PER_SECTION + 1;
        const e = secIdx * QUESTIONS_PER_SECTION;
        const [ns] = await db.insert(sections)
          .values({ examId: exam.id, title: secTitle, description: `問${s}〜${e}`, order: secIdx })
          .returning({ id: sections.id });
        sectionId = ns.id;
      }

      const qText = processImages(q.text, yearDir, imgDir, copies);
      const exp = explanationsMap.get(q.number) || null;
      const expP = exp ? processImages(exp, yearDir, imgDir, copies) : null;
      const answerNum = answersMap.get(q.number) || "1";
      // 1→A, 2→B, 3→C の変換
      const correctMap: Record<string, string> = { "1": "A", "2": "B", "3": "C" };
      const correct = correctMap[answerNum] || "A";
      const hasImage = [qText, expP].some(t => t && t.includes("/images/kakomon/"));

      const vals = {
        sectionId, questionText: qText,
        questionType: "choice" as const,
        optionA: q.options[0] || "選択肢1",
        optionB: q.options[1] || "選択肢2",
        optionC: q.options[2] || "選択肢3",
        optionD: null,
        correctAnswer: correct,
        explanation: expP,
        order: globalIdx,
        examYearId,
        questionNumber: q.number,
        hasImage,
        sourceNote: `${label} 問${q.number}`,
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
