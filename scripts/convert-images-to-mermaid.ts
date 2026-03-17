import fs from "fs";
import path from "path";

// .env.local 読み込み
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    if (!process.env[t.substring(0, i).trim()])
      process.env[t.substring(0, i).trim()] = t.substring(i + 1).trim();
  }
}

import { db } from "../src/backend/db/client";
import { questions } from "../src/backend/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * 画像付き問題の図をmermaid記法に変換するスクリプト
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx npx tsx scripts/convert-images-to-mermaid.ts [--dry-run] [--limit 10]
 *
 * 処理:
 *   1. questionText内の![alt](url)を検出
 *   2. 画像ファイルを読み込み、Gemini APIでmermaid記法に変換
 *   3. 成功した場合、元の画像参照の下にmermaidコードブロックを追加
 *   4. 元の画像は残す（フォールバック用）
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 5;
})();

const MERMAID_CONVERTIBLE_TYPES = [
  "ネットワーク構成図",
  "フローチャート",
  "状態遷移図",
  "シーケンス図",
  "ER図",
  "クラス図",
  "組織図",
  "処理フロー",
  "システム構成図",
  "データフロー",
];

const PROMPT = `あなたは図表をmermaid記法に変換する専門家です。
添付された画像を分析し、以下のルールに従ってmermaid記法に変換してください。

## ルール
1. 画像がmermaidで表現可能な構造化された図（フローチャート、ネットワーク構成図、ER図、シーケンス図、状態遷移図、クラス図等）の場合のみ変換してください
2. 表、グラフ、手書き風の図、写真、数式など mermaidで表現できないものは "NOT_CONVERTIBLE" とだけ返してください
3. 日本語のラベルはそのまま日本語で記述してください
4. できるだけ元の図の構造・接続関係を忠実に再現してください
5. mermaid記法のみを出力してください。説明文や\`\`\`は不要です

## 出力
mermaid記法のテキストのみ、または "NOT_CONVERTIBLE"`;

async function convertImageToMermaid(
  imagePath: string,
): Promise<string | null> {
  if (!fs.existsSync(imagePath)) {
    return null;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString("base64");
  const mimeType = "image/png";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`  API error: ${response.status} ${err.substring(0, 200)}`);
    return null;
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

  if (text === "NOT_CONVERTIBLE" || text.includes("NOT_CONVERTIBLE")) {
    return null;
  }

  // mermaid記法のバリデーション（最低限）
  const validStarts = [
    "graph",
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "pie",
    "mindmap",
  ];
  const firstLine = text.split("\n")[0].trim();
  if (!validStarts.some((s) => firstLine.startsWith(s))) {
    console.log(`  Not valid mermaid (starts with: ${firstLine.substring(0, 30)})`);
    return null;
  }

  return text;
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY が設定されていません");
    console.error(
      "  GEMINI_API_KEY=xxx npx tsx scripts/convert-images-to-mermaid.ts",
    );
    process.exit(1);
  }

  console.log(`🚀 画像→mermaid変換開始 (limit=${LIMIT}, dry-run=${DRY_RUN})\n`);

  // 画像参照を含む問題を取得
  const allQuestions = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      sourceNote: questions.sourceNote,
    })
    .from(questions)
    .where(eq(questions.hasImage, true))
    .all();

  console.log(`画像付き問題: ${allQuestions.length}件\n`);

  // 既にmermaidが含まれる問題は除外
  const targets = allQuestions.filter(
    (q) => !q.questionText.includes("```mermaid"),
  );
  console.log(`変換対象（mermaid未適用）: ${targets.length}件\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const q of targets.slice(0, LIMIT)) {
    // 画像参照を抽出
    const imageRefs = [
      ...q.questionText.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g),
    ];
    if (imageRefs.length === 0) continue;

    console.log(`--- qId=${q.id} (${q.sourceNote}) ---`);

    let updatedText = q.questionText;
    let hasConversion = false;

    for (const ref of imageRefs) {
      const [fullMatch, alt, url] = ref;

      // public/images/以下の画像パスを解決
      const imagePath = url.startsWith("/")
        ? path.join(process.cwd(), "public", url)
        : path.join(process.cwd(), url);

      console.log(`  画像: ${alt || path.basename(url)}`);

      try {
        const mermaid = await convertImageToMermaid(imagePath);
        if (mermaid) {
          console.log(
            `  ✅ mermaid変換成功 (${mermaid.split("\n").length}行)`,
          );
          // 元の画像参照の後にmermaidブロックを追加
          const mermaidBlock = `\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n`;
          updatedText = updatedText.replace(
            fullMatch,
            `${fullMatch}${mermaidBlock}`,
          );
          hasConversion = true;
          converted++;
        } else {
          console.log(`  ⏭️ mermaid変換不可（表・グラフ等）`);
          skipped++;
        }
      } catch (e) {
        console.error(
          `  ❌ エラー: ${e instanceof Error ? e.message : String(e)}`,
        );
        failed++;
      }

      // API制限回避
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (hasConversion && !DRY_RUN) {
      await db
        .update(questions)
        .set({ questionText: updatedText })
        .where(eq(questions.id, q.id));
      console.log(`  💾 DB更新完了`);
    } else if (hasConversion && DRY_RUN) {
      console.log(`  [DRY-RUN] DB更新スキップ`);
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`完了: 変換=${converted}, スキップ=${skipped}, 失敗=${failed}`);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
