import fs from "fs";
import path from "path";
import { db } from "../src/backend/db/client";
import { questions } from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

/**
 * rawDataに元画像が存在しない不足画像を
 * テキスト説明に置き換えるスクリプト
 */

// 不足しているqIds（check-db-stateで特定済み）
const missingQIds = [
  // 応用情報午後 2020秋 問6: 図6_P31_text_1.png（rawDataに存在しない）
  7908, 7909, 7910, 7911, 7912,
  // DB 2022秋 PM2 問1: 図4_1.png（rawDataに存在しない）
  9140, 9141, 9142, 9143, 9144, 9145, 9146, 9147, 9148, 9149, 9150,
  // SC 2020秋 PM1 問3: 図4_4.png（rawDataに存在しない）
  9579, 9580, 9581, 9582, 9583, 9584, 9585,
];

async function main() {
  console.log("🔧 rawDataに存在しない画像参照を代替テキストに変換\n");

  for (const qId of missingQIds) {
    const [q] = await db.select().from(questions).where(eq(questions.id, qId));
    if (!q) continue;

    const fields = ["questionText", "explanation"] as const;
    const updates: Record<string, string | null> = {};
    let changed = false;

    for (const field of fields) {
      let text = q[field] as string | null;
      if (!text) continue;

      // 存在しない画像参照を説明テキストに変換
      const newText = text.replace(
        /!\[([^\]]*)\]\(\/images\/kakomon\/[^)]+\/([^)]+)\)/g,
        (match, alt, filename) => {
          const fullPath = path.join(process.cwd(), "public", "images", "kakomon");
          // matchのフルパスを再構築
          const pathMatch = match.match(/\/images\/kakomon\/[^)]+/);
          if (pathMatch) {
            const checkPath = path.join(process.cwd(), "public", pathMatch[0]);
            if (!fs.existsSync(checkPath)) {
              const label = alt || filename.replace(/\.(png|jpg)$/i, "");
              console.log(`  qId=${qId}: ${filename} → 【${label}】（※原本の図表を参照してください）`);
              changed = true;
              return `**【${label}】**（※原本の図表を参照してください）`;
            }
          }
          return match;
        },
      );

      if (newText !== text) {
        updates[field] = newText;
      }
    }

    if (changed) {
      await db.update(questions).set(updates).where(eq(questions.id, qId));
    }
  }

  // 残っている不足を確認
  let remaining = 0;
  for (const qId of missingQIds) {
    const [q] = await db.select().from(questions).where(eq(questions.id, qId));
    if (!q) continue;
    const texts = [q.questionText, q.explanation];
    for (const t of texts) {
      if (!t) continue;
      const imgs = [...t.matchAll(/!\[[^\]]*\]\(\/images\/kakomon\/[^)]+\)/g)];
      for (const m of imgs) {
        const pathMatch = m[0].match(/\/images\/kakomon\/[^)]+/);
        if (pathMatch) {
          const checkPath = path.join(process.cwd(), "public", pathMatch[0]);
          if (!fs.existsSync(checkPath)) remaining++;
        }
      }
    }
  }

  console.log(`\n✅ 完了 (残り不足: ${remaining}件)`);
}

main().catch(console.error);
