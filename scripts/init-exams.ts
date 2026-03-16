/* eslint-disable @typescript-eslint/no-require-imports */
import fs from "fs";
import path from "path";

// .env.local を読み込んで process.env に設定 (import hoisting前に実行される必要あり)
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
import {
  exams,
  sections,
  questions,
  examYears,
  ipaCategories,
  sectionProgress,
  sectionQuestionProgress,
  userQuestionRecords,
  mockTestHistory,
  mockTestDetails,
} from "../src/backend/db/schema";
import { sql } from "drizzle-orm";

/**
 * examsテーブル初期化スクリプト
 *
 * 既存のサンプルデータをすべて削除し、
 * rawDataフォルダの構成に基づいて全15試験を登録する。
 *
 * 使い方: npx tsx scripts/init-exams.ts
 */

// 登録する全試験の定義
const examDefinitions = [
  // ── FP系 ──
  {
    title: "FP2級 学科試験",
    description: "ファイナンシャル・プランニング技能検定2級 学科試験（4択60問）",
    slug: "fp2-gakka",
  },
  {
    title: "FP2級 実技試験",
    description: "ファイナンシャル・プランニング技能検定2級 実技試験",
    slug: "fp2-jitsugi",
  },
  {
    title: "FP3級 学科試験",
    description: "ファイナンシャル・プランニング技能検定3級 学科試験",
    slug: "fp3-gakka",
  },
  {
    title: "FP3級 実技試験",
    description: "ファイナンシャル・プランニング技能検定3級 実技試験",
    slug: "fp3-jitsugi",
  },
  // ── IPA 応用情報 ──
  {
    title: "応用情報 午前",
    description: "応用情報技術者試験 午前問題（4択80問）",
    slug: "ap-gozen",
  },
  {
    title: "応用情報 午後",
    description: "応用情報技術者試験 午後問題（記述式）",
    slug: "ap-gogo",
  },
  // ── IPA 高度試験 ──
  {
    title: "ITサービスマネージャ",
    description: "ITサービスマネージャ試験 午後問題（記述式）",
    slug: "sm",
  },
  {
    title: "ITストラテジスト",
    description: "ITストラテジスト試験 午後問題（記述式）",
    slug: "st",
  },
  {
    title: "エンベデッドシステムスペシャリスト",
    description: "エンベデッドシステムスペシャリスト試験 午後問題（記述式）",
    slug: "es",
  },
  {
    title: "システムアーキテクト",
    description: "システムアーキテクト試験 午後問題（記述式）",
    slug: "sa",
  },
  {
    title: "システム監査技術者",
    description: "システム監査技術者試験 午後問題（記述式）",
    slug: "au",
  },
  {
    title: "データベーススペシャリスト",
    description: "データベーススペシャリスト試験 午後問題（記述式）",
    slug: "db",
  },
  {
    title: "ネットワークスペシャリスト",
    description: "ネットワークスペシャリスト試験 午後問題（記述式）",
    slug: "nw",
  },
  {
    title: "プロジェクトマネージャ",
    description: "プロジェクトマネージャ試験 午後問題（記述式）",
    slug: "pm",
  },
  {
    title: "情報処理安全確保支援士",
    description: "情報処理安全確保支援士試験 午後問題（記述式）",
    slug: "sc",
  },
];

async function main() {
  console.log("🗑️  既存データを削除中...");

  // 依存関係の順にデータを削除（外部キー制約考慮）
  await db.delete(mockTestDetails);
  await db.delete(mockTestHistory);
  await db.delete(sectionQuestionProgress);
  await db.delete(sectionProgress);
  await db.delete(userQuestionRecords);
  await db.delete(questions);
  await db.delete(sections);
  await db.delete(examYears);
  await db.delete(ipaCategories);
  await db.delete(exams);

  // AUTO_INCREMENTのリセット
  await db.run(
    sql`DELETE FROM sqlite_sequence WHERE name IN ('exams', 'sections', 'questions', 'exam_years', 'ipa_categories', 'mock_test_history', 'mock_test_details')`
  );

  console.log("✅ 既存データの削除完了");

  // 全試験を登録
  console.log("\n📝 試験区分を登録中...\n");

  for (const examDef of examDefinitions) {
    const [inserted] = await db
      .insert(exams)
      .values(examDef)
      .returning({ id: exams.id, title: exams.title });

    console.log(`  ✅ id=${inserted.id}: ${inserted.title} (slug: ${examDef.slug})`);
  }

  console.log(`\n🎉 完了! ${examDefinitions.length}件の試験区分を登録しました。`);
}

main().catch((err) => {
  console.error("❌ エラーが発生しました:", err);
  process.exit(1);
});
