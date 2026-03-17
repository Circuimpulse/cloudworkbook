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
 * IPA高度試験・午後試験 汎用MDインポートスクリプト
 *
 * 対応フォーマット:
 *   (A) pm1_問題.md / pm2_問題.md ... (高度試験: ITサービスマネージャー等)
 *   (B) gogo_問題.md (応用情報午後)
 *
 * 使い方:
 *   npx tsx scripts/import-ipa-gogo.ts
 *
 * 設問単位で1問としてDBに登録する。
 * 例: 問1 設問1(1)(2) + 設問2(1) → 3問
 */

// ─── 設定 ─────────────────────────────────────────────

// 応用情報午後: 問番号→分野マッピング（毎年固定）
const AP_GOGO_CATEGORY: Record<number, string> = {
  1: "情報セキュリティ",
  2: "経営戦略",
  3: "プログラミング",
  4: "システムアーキテクチャ",
  5: "ネットワーク",
  6: "データベース",
  7: "組込みシステム開発",
  8: "情報システム開発",
  9: "プロジェクトマネジメント",
  10: "サービスマネジメント",
  11: "システム監査",
};

// rawDataフォルダ名 → DB上のexam title のマッピング
const EXAM_MAP: {
  rawDirName: string;
  examTitle: string;
  filePrefix: string[]; // pm1, pm2, gogo etc.
}[] = [
  {
    rawDirName: "応用情報＿午後",
    examTitle: "応用情報 午後",
    filePrefix: ["gogo"],
  },
  {
    rawDirName: "ITサービスマネージャー",
    examTitle: "ITサービスマネージャ",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "ITストラテジスト",
    examTitle: "ITストラテジスト",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "エンベデッドシステムスペシャリスト",
    examTitle: "エンベデッドシステムスペシャリスト",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "システムアーキテクト",
    examTitle: "システムアーキテクト",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "システム監査技術者",
    examTitle: "システム監査技術者",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "データベーススペシャリスト",
    examTitle: "データベーススペシャリスト",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "ネットワークスペシャリスト",
    examTitle: "ネットワークスペシャリスト",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "プロジェクトマネージャー",
    examTitle: "プロジェクトマネージャ",
    filePrefix: ["pm1", "pm2"],
  },
  {
    rawDirName: "情報処理安全確保支援",
    examTitle: "情報処理安全確保支援士",
    filePrefix: ["pm1", "pm2", "gogo"],
  },
];

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

// ─── 問題.md パーサー（午後試験） ──────────────────────
interface ParsedGogoQuestion {
  mondaiNum: number; // 問1, 問2...
  setsumonNum: number; // 設問1, 設問2...
  subNum: string; // (1), (2)... or ""
  questionText: string; // 設問テキスト（要約）
  fullContext: string; // 問全体のコンテキスト（シナリオ）
  prefix: string; // pm1, pm2, gogo
}

function parseGogoQuestionsFile(
  filePath: string,
  prefix: string,
): ParsedGogoQuestion[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const results: ParsedGogoQuestion[] = [];

  // # 問X で大問を分割
  const mondaiSplit = content.split(/^# 問(\d+)/gm);
  // ['header', '1', 'body1', '2', 'body2', ...]

  for (let i = 1; i < mondaiSplit.length; i += 2) {
    const mondaiNum = parseInt(mondaiSplit[i], 10);
    const mondaiBody = (mondaiSplit[i + 1] || "").trim();

    // 大問のタイトル行（最初の行）を取得
    const titleLine = mondaiBody.split("\n")[0]?.trim() || "";

    // ## 設問 X で設問を分割
    const setsumonSplit = mondaiBody.split(/^## 設問\s*(\d+)/gm);
    const contextPart = setsumonSplit[0]?.trim() || ""; // 設問より前のシナリオ部分（全文保持）

    if (setsumonSplit.length <= 1) {
      // 設問が見つからない場合、大問全体を1問として登録
      results.push({
        mondaiNum,
        setsumonNum: 1,
        subNum: "",
        questionText: mondaiBody.substring(0, 500),
        fullContext: mondaiBody,
        prefix,
      });
      continue;
    }

    for (let j = 1; j < setsumonSplit.length; j += 2) {
      const setsumonNum = parseInt(setsumonSplit[j], 10);
      const setsumonBody = (setsumonSplit[j + 1] || "").trim();

      // 小問 (1), (2)... を検出
      const subQuestions = setsumonBody.split(/^\((\d+)\)\s/gm);

      if (subQuestions.length > 1) {
        // 小問がある場合
        for (let k = 1; k < subQuestions.length; k += 2) {
          const subNum = subQuestions[k];
          const subBody = (subQuestions[k + 1] || "").trim();
          results.push({
            mondaiNum,
            setsumonNum,
            subNum: `(${subNum})`,
            questionText: subBody.substring(0, 500),
            fullContext: contextPart,
            prefix,
          });
        }
      } else {
        // 小問がない場合、設問全体を1問として登録
        results.push({
          mondaiNum,
          setsumonNum,
          subNum: "",
          questionText: setsumonBody.substring(0, 500),
          fullContext: contextPart,
          prefix,
        });
      }
    }
  }

  return results;
}

// ─── 解答.md パーサー（午後試験） ──────────────────────
function parseGogoAnswersFile(filePath: string): Map<string, string> {
  if (!fs.existsSync(filePath)) return new Map();
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();

  // テーブル形式の解答を抽出
  // | 設問 | 解答例・解答の要点 | 備考 |
  const mondaiSplit = content.split(/^# 問(\d+)/gm);

  for (let i = 1; i < mondaiSplit.length; i += 2) {
    const mondaiNum = mondaiSplit[i];
    const body = mondaiSplit[i + 1] || "";

    // テーブル行を解析
    const rows = body.match(/^\|\s*設問.*?\|.*?\|/gm);
    if (rows) {
      for (const row of rows) {
        // ヘッダ行をスキップ
        if (row.includes("解答例") || row.includes("---")) continue;

        const cells = row
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        if (cells.length >= 2) {
          const setsumonLabel = cells[0]; // "設問１ (1)" or "設問１"
          const answer = cells[1];

          // 設問番号と小問番号を抽出
          const setMatch = setsumonLabel.match(
            /設問[１-９\d]+/,
          );
          const subMatch = setsumonLabel.match(/\((\d+)\)/);

          if (setMatch) {
            const setNum = setsumonLabel.replace(/[^０-９\d]/g, "").replace(/[０-９]/g, (c) =>
              String("０１２３４５６７８９".indexOf(c)),
            );
            const key = `問${mondaiNum}_設問${setNum}${subMatch ? `(${subMatch[1]})` : ""}`;
            map.set(key, answer);
          }
        }
      }
    }

    // テーブルではなく、フリーテキスト形式の解答も試みる
    // 設問1, 設問2 のラベルで分割
    const setsumonSplit = body.split(/^###?\s*設問\s*(\d+)/gm);
    for (let j = 1; j < setsumonSplit.length; j += 2) {
      const setNum = setsumonSplit[j];
      const setBody = (setsumonSplit[j + 1] || "").trim();
      if (setBody && !map.has(`問${mondaiNum}_設問${setNum}`)) {
        map.set(`問${mondaiNum}_設問${setNum}`, setBody.substring(0, 500));
      }
    }
  }

  return map;
}

// ─── 解説.md パーサー ──────────────────────────────────
function parseGogoExplanationsFile(filePath: string): Map<string, string> {
  if (!fs.existsSync(filePath)) return new Map();
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();

  const mondaiSplit = content.split(/^# 問(\d+)/gm);
  for (let i = 1; i < mondaiSplit.length; i += 2) {
    const mondaiNum = mondaiSplit[i];
    const body = mondaiSplit[i + 1] || "";

    // 大問全体の解説をキーとして保存
    map.set(`問${mondaiNum}`, body.trim());

    // 設問ごとの解説も抽出
    const setsumonSplit = body.split(/^###?\s*設問\s*(\d+)/gm);
    for (let j = 1; j < setsumonSplit.length; j += 2) {
      const setNum = setsumonSplit[j];
      const setBody = (setsumonSplit[j + 1] || "").trim();
      map.set(`問${mondaiNum}_設問${setNum}`, setBody);
    }
  }

  return map;
}

// ─── 画像処理 ──────────────────────────────────────────
function processImages(
  text: string,
  sourceDir: string,
  destDir: string,
  copyPromises: Promise<void>[],
  filePrefix?: string, // gogo, pm1, pm2 等
): string {
  if (!text) return text;
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  return text.replace(regex, (match, alt, imgPath) => {
    const filename = path.basename(imgPath);
    
    // 1. そのままのファイル名で検索
    let sourcePath = path.join(sourceDir, filename);
    
    // 2. プレフィックス付きファイル名で検索（例: 図1_1.png → gogo_図1_1.png）
    if (!fs.existsSync(sourcePath) && filePrefix) {
      const prefixedFilename = `${filePrefix}_${filename}`;
      const prefixedPath = path.join(sourceDir, prefixedFilename);
      if (fs.existsSync(prefixedPath)) {
        sourcePath = prefixedPath;
      }
    }
    
    const destPath = path.join(destDir, filename);
    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
      copyPromises.push(fs.promises.copyFile(sourcePath, destPath));
    }
    const publicPath = `/images/kakomon/${path.basename(destDir)}/${filename}`;
    return `![${alt}](${publicPath})`;
  });
}

// ─── メイン処理 ────────────────────────────────────────
async function main() {
  console.log("🚀 IPA午後試験 一括インポート開始\n");

  let grandTotalInsert = 0;
  let grandTotalImages = 0;

  for (const examConfig of EXAM_MAP) {
    const rawDir = path.join(
      process.cwd(),
      "rawData",
      "IPA_kakomon",
      examConfig.rawDirName,
    );

    if (!fs.existsSync(rawDir)) {
      console.log(`⚠️ ${examConfig.rawDirName}: フォルダが見つかりません。スキップ。`);
      continue;
    }

    // 試験区分の取得
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.title, examConfig.examTitle));

    if (!exam) {
      console.log(`⚠️ ${examConfig.examTitle}: DB上の試験レコードが見つかりません。スキップ。`);
      continue;
    }

    console.log(`\n${"═".repeat(60)}`);
    console.log(`📋 ${examConfig.examTitle} (id=${exam.id})`);
    console.log(`${"═".repeat(60)}`);

    // 年度フォルダ一覧
    const yearDirs = fs
      .readdirSync(rawDir)
      .filter((d) => fs.statSync(path.join(rawDir, d)).isDirectory())
      .sort();

    let globalSectionOrder = 0;
    let examTotalInsert = 0;
    let examTotalImages = 0;

    for (const dirName of yearDirs) {
      const dirPath = path.join(rawDir, dirName);
      const { year, season, label } = parseDirName(dirName);

      // ExamYear の取得・作成
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
      } else {
        const [newYear] = await db
          .insert(examYears)
          .values({ examId: exam.id, year, season, label })
          .returning({ id: examYears.id });
        examYearId = newYear.id;
      }

      // 画像ディレクトリの準備
      const folderSlug = `${exam.slug}_${dirName}`;
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

      // 各プレフィックスのファイルを処理
      for (const prefix of examConfig.filePrefix) {
        const qFile = path.join(dirPath, `${prefix}_問題.md`);
        const aFile = path.join(dirPath, `${prefix}_解答.md`);
        const kFile = path.join(dirPath, `${prefix}_解説.md`);

        if (!fs.existsSync(qFile)) continue;

        const parsedQuestions = parseGogoQuestionsFile(qFile, prefix);
        const answers = parseGogoAnswersFile(aFile);
        const explanations = parseGogoExplanationsFile(kFile);

        // セクションキャッシュ: "prefix_mondaiNum" → sectionId
        const sectionCache = new Map<string, number>();

        for (let qi = 0; qi < parsedQuestions.length; qi++) {
          const q = parsedQuestions[qi];

          // セクション決定（1大問＝1セクション）
          const sectionKey = `${prefix}_${q.mondaiNum}`;

          if (!sectionCache.has(sectionKey)) {
            globalSectionOrder++;
            const sectionTitle = `#${globalSectionOrder}`;

            // 応用情報午後の場合は分野名を含める
            const isApGogo = examConfig.rawDirName === "応用情報＿午後";
            const category = isApGogo ? AP_GOGO_CATEGORY[q.mondaiNum] || "" : "";

            const prefixLabel =
              prefix === "gogo"
                ? "午後"
                : prefix === "pm1"
                  ? "午後Ⅰ"
                  : "午後Ⅱ";

            const sectionDesc = category
              ? `${label} ${prefixLabel} 問${q.mondaiNum} ${category}`
              : `${label} ${prefixLabel} 問${q.mondaiNum}`;

            const [newSec] = await db
              .insert(sections)
              .values({
                examId: exam.id,
                title: sectionTitle,
                description: sectionDesc,
                order: globalSectionOrder,
              })
              .returning({ id: sections.id });
            sectionCache.set(sectionKey, newSec.id);
          }

          const sectionId = sectionCache.get(sectionKey)!;

          // 問題テキスト構築
          const qLabel = `問${q.mondaiNum} 設問${q.setsumonNum}${q.subNum}`;
          const fullQuestionText = `**【${qLabel}】**\n\n${q.fullContext}\n\n---\n\n**${qLabel}**\n\n${q.questionText}`;

          // 解答の取得
          const answerKey = `問${q.mondaiNum}_設問${q.setsumonNum}${q.subNum}`;
          const answerKeyNoSub = `問${q.mondaiNum}_設問${q.setsumonNum}`;
          const correctAnswer =
            answers.get(answerKey) || answers.get(answerKeyNoSub) || "解答を参照";

          // 解説の取得
          const explKey = `問${q.mondaiNum}_設問${q.setsumonNum}`;
          const explKeyMondai = `問${q.mondaiNum}`;
          const explanation =
            explanations.get(explKey) || explanations.get(explKeyMondai) || null;

          // 画像処理
          const processedQText = processImages(
            fullQuestionText,
            dirPath,
            publicImagesDir,
            copyPromises,
            prefix,
          );
          const processedExpl = explanation
            ? processImages(explanation, dirPath, publicImagesDir, copyPromises, prefix)
            : null;

          const hasImage =
            processedQText.includes("/images/kakomon/") ||
            (processedExpl?.includes("/images/kakomon/") || false);

          // DB挿入
          await db.insert(questions).values({
            sectionId,
            questionText: processedQText,
            questionType: "descriptive",
            optionA: "記述式",
            optionB: "記述式",
            optionC: null,
            optionD: null,
            correctAnswer: correctAnswer.substring(0, 1000),
            explanation: processedExpl,
            order: qi + 1,
            examYearId,
            questionNumber: qi + 1,
            hasImage,
            sourceNote: `${label} ${prefix === "gogo" ? "午後" : prefix.toUpperCase()} ${qLabel}`,
          });

          examTotalInsert++;
        }
      }

      // 画像コピー
      await Promise.all(copyPromises);
      examTotalImages += copyPromises.length;

      console.log(
        `  ${label}: ${examTotalInsert > 0 ? "✅" : "⚠️"} 画像${copyPromises.length}件`,
      );
    }

    console.log(`  📊 合計: ${examTotalInsert}問, 画像${examTotalImages}件`);
    grandTotalInsert += examTotalInsert;
    grandTotalImages += examTotalImages;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎉 全試験インポート完了!`);
  console.log(`  新規追加: ${grandTotalInsert} 件`);
  console.log(`  画像コピー: ${grandTotalImages} 件`);
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
