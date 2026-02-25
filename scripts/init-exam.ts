import fs from "fs";
import path from "path";

/**
 * 過去問インポート用ディレクトリの初期化スクリプト
 *
 * 使い方:
 * npx tsx scripts/init-exam.ts <ExamSlug> <Year> <Season>
 * 例: npx tsx scripts/init-exam.ts AP 2024 Autumn
 */

const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error("❌ エラー: 引数が不足しています。");
  console.error(
    "使い方: npx tsx scripts/init-exam.ts <ExamSlug> <Year> <Season>",
  );
  console.error("例: npx tsx scripts/init-exam.ts AP 2024 Autumn");
  process.exit(1);
}

const [examSlug, year, season] = args;
const folderName = `${examSlug}_${year}_${season}`;
const targetDir = path.join(process.cwd(), "IPA_kakomon", folderName);
const imagesDir = path.join(targetDir, "images");
const markdownFile = path.join(targetDir, "data.csv");

// ディレクトリの作成
if (fs.existsSync(targetDir)) {
  console.error(`⚠️ すでにディレクトリが存在します: ${targetDir}`);
  process.exit(1);
}

try {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`✅ 作成しました: ${imagesDir}`);

  // CSVテンプレートの作成
  const csvHeader =
    "questionNumber,categoryLevel1,categoryLevel2,categoryLevel3,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,sourceNote";

  fs.writeFileSync(markdownFile, csvHeader, "utf-8");
  console.log(`✅ 作成しました: ${markdownFile}`);

  console.log("\n🎉 初期化が完了しました。");
  console.log(`📂 ディレクトリ: ${targetDir}`);
  console.log("📝 次のステップ:");
  console.log("1. PDFファイルをこのディレクトリに保存してください。");
  console.log(
    "2. data.csv に問題データを Markdown 形式で記入してください。画像の埋め込みは ![alt](images/ファイル名.png) を使用してください。",
  );
  console.log(
    "3. 図表などの画像は images/ ディレクトリに保存してください（例: q1_fig1.png）。",
  );
} catch (error) {
  console.error("❌ 初期化中にエラーが発生しました:", error);
}
