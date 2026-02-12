import { db } from "../backend/db/client";
import { sections, questions, exams } from "../backend/db/schema";

/**
 * サンプルデータ投入スクリプト
 *
 * 実行方法:
 * tsx scripts/seed.ts
 */

async function seed() {
  console.log("🌱 Seeding database...");

  // 試験区分を作成
  const [exam1] = await db
    .insert(exams)
    .values({
      title: "応用情報試験：午前",
      description: "応用情報技術者試験の午前問題",
      slug: "applied-information-am",
    })
    .returning();

  console.log(`✅ Created exam: ${exam1.title}`);

  const [exam2] = await db
    .insert(exams)
    .values({
      title: "応用情報試験：午後",
      description: "応用情報技術者試験の午後問題",
      slug: "applied-information-pm",
    })
    .returning();

  console.log(`✅ Created exam: ${exam2.title}`);

  const [exam3] = await db
    .insert(exams)
    .values({
      title: "FP3級：午前",
      description: "ファイナンシャルプランナー3級の午前問題",
      slug: "fp3-am",
    })
    .returning();

  console.log(`✅ Created exam: ${exam3.title}`);

  const [exam4] = await db
    .insert(exams)
    .values({
      title: "FP3級：午後",
      description: "ファイナンシャルプランナー3級の午後問題",
      slug: "fp3-pm",
    })
    .returning();

  console.log(`✅ Created exam: ${exam4.title}`);

  // 応用情報試験のセクション1
  const [section1] = await db
    .insert(sections)
    .values({
      examId: exam1.id,
      title: "応用情報#01",
      description: "基礎知識",
      order: 1,
    })
    .returning();

  console.log(`✅ Created section: ${section1.title}`);

  // 応用情報試験のセクション1の問題（7問）
  const section1Questions = [
    {
      questionText: "次のうち、正しい記述はどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "A",
      explanation: "選択肢Aが正解です。なぜなら...",
    },
    {
      questionText: "次のうち、誤った記述はどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "B",
      explanation: "選択肢Bが誤りです。正しくは...",
    },
    {
      questionText: "次の説明に最も適した用語はどれですか？",
      optionA: "用語A",
      optionB: "用語B",
      optionC: "用語C",
      optionD: "用語D",
      correctAnswer: "C",
      explanation: "用語Cが最も適切です。",
    },
    {
      questionText: "次のうち、最も効率的な方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "D",
      explanation: "方法Dが最も効率的です。",
    },
    {
      questionText: "次の計算結果として正しいものはどれですか？",
      optionA: "100",
      optionB: "200",
      optionC: "300",
      optionD: "400",
      correctAnswer: "B",
      explanation: "計算結果は200です。",
    },
    {
      questionText: "次のうち、推奨される手順はどれですか？",
      optionA: "手順A",
      optionB: "手順B",
      optionC: "手順C",
      optionD: "手順D",
      correctAnswer: "A",
      explanation: "手順Aが推奨されます。",
    },
    {
      questionText: "次の説明に該当するものはどれですか？",
      optionA: "項目A",
      optionB: "項目B",
      optionC: "項目C",
      optionD: "項目D",
      correctAnswer: "C",
      explanation: "項目Cが該当します。",
    },
  ];

  for (let i = 0; i < section1Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section1.id,
      ...section1Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section1Questions.length} questions for section 1`);

  // 応用情報試験のセクション2
  const [section2] = await db
    .insert(sections)
    .values({
      examId: exam1.id,
      title: "応用情報#02",
      description: "応用問題",
      order: 2,
    })
    .returning();

  console.log(`✅ Created section: ${section2.title}`);

  // 応用情報試験のセクション2の問題（7問）
  const section2Questions = [
    {
      questionText: "次のケースで最も適切な対応はどれですか？",
      optionA: "対応A",
      optionB: "対応B",
      optionC: "対応C",
      optionD: "対応D",
      correctAnswer: "B",
      explanation: "対応Bが最も適切です。",
    },
    {
      questionText: "次の状況で優先すべき事項はどれですか？",
      optionA: "事項A",
      optionB: "事項B",
      optionC: "事項C",
      optionD: "事項D",
      correctAnswer: "A",
      explanation: "事項Aを優先すべきです。",
    },
    {
      questionText: "次のうち、リスクが最も高いものはどれですか？",
      optionA: "リスクA",
      optionB: "リスクB",
      optionC: "リスクC",
      optionD: "リスクD",
      correctAnswer: "C",
      explanation: "リスクCが最も高いです。",
    },
    {
      questionText: "次の問題を解決する最良の方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "D",
      explanation: "方法Dが最良です。",
    },
    {
      questionText: "次のうち、コストが最も低いものはどれですか？",
      optionA: "選択肢A",
      optionB: "選択肢B",
      optionC: "選択肢C",
      optionD: "選択肢D",
      correctAnswer: "B",
      explanation: "選択肢Bが最もコストが低いです。",
    },
    {
      questionText: "次の改善案で最も効果的なものはどれですか？",
      optionA: "改善案A",
      optionB: "改善案B",
      optionC: "改善案C",
      optionD: "改善案D",
      correctAnswer: "A",
      explanation: "改善案Aが最も効果的です。",
    },
    {
      questionText: "次のうち、法令に違反するものはどれですか？",
      optionA: "行為A",
      optionB: "行為B",
      optionC: "行為C",
      optionD: "行為D",
      correctAnswer: "C",
      explanation: "行為Cは法令違反です。",
    },
  ];

  for (let i = 0; i < section2Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section2.id,
      ...section2Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section2Questions.length} questions for section 2`);

  // 応用情報試験のセクション3
  const [section3] = await db
    .insert(sections)
    .values({
      examId: exam1.id,
      title: "応用情報#03",
      description: "実践演習",
      order: 3,
    })
    .returning();

  console.log(`✅ Created section: ${section3.title}`);

  // 応用情報試験のセクション3の問題（7問）
  const section3Questions = [
    {
      questionText: "次のシナリオで取るべき行動はどれですか？",
      optionA: "行動A",
      optionB: "行動B",
      optionC: "行動C",
      optionD: "行動D",
      correctAnswer: "B",
      explanation: "行動Bが適切です。",
    },
    {
      questionText: "次の計画で最も重要な要素はどれですか？",
      optionA: "要素A",
      optionB: "要素B",
      optionC: "要素C",
      optionD: "要素D",
      correctAnswer: "A",
      explanation: "要素Aが最も重要です。",
    },
    {
      questionText: "次のうち、ベストプラクティスはどれですか？",
      optionA: "プラクティスA",
      optionB: "プラクティスB",
      optionC: "プラクティスC",
      optionD: "プラクティスD",
      correctAnswer: "C",
      explanation: "プラクティスCがベストプラクティスです。",
    },
    {
      questionText: "次の評価基準で最も重視すべきものはどれですか？",
      optionA: "基準A",
      optionB: "基準B",
      optionC: "基準C",
      optionD: "基準D",
      correctAnswer: "D",
      explanation: "基準Dを最も重視すべきです。",
    },
    {
      questionText: "次のうち、持続可能な方法はどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "B",
      explanation: "方法Bが持続可能です。",
    },
    {
      questionText: "次の戦略で最も効果的なものはどれですか？",
      optionA: "戦略A",
      optionB: "戦略B",
      optionC: "戦略C",
      optionD: "戦略D",
      correctAnswer: "A",
      explanation: "戦略Aが最も効果的です。",
    },
    {
      questionText: "次のうち、倫理的に問題があるものはどれですか？",
      optionA: "行為A",
      optionB: "行為B",
      optionC: "行為C",
      optionD: "行為D",
      correctAnswer: "C",
      explanation: "行為Cは倫理的に問題があります。",
    },
  ];

  for (let i = 0; i < section3Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: section3.id,
      ...section3Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${section3Questions.length} questions for section 3`);

  // 応用情報試験：午後のセクション1
  const [examPm1] = await db
    .insert(sections)
    .values({
      examId: exam2.id,
      title: "応用情報午後#01",
      description: "午後問題：基礎編",
      order: 1,
    })
    .returning();

  console.log(`✅ Created section: ${examPm1.title}`);

  // 応用情報午後のセクション1の問題（7問）
  const examPm1Questions = [
    {
      questionText: "次のプロジェクト管理手法として正しいものはどれですか？",
      optionA: "手法A",
      optionB: "手法B",
      optionC: "手法C",
      optionD: "手法D",
      correctAnswer: "B",
      explanation: "手法Bが正しいプロジェクト管理手法です。",
    },
    {
      questionText: "次のシステム設計で重要な要素はどれですか？",
      optionA: "要素A",
      optionB: "要素B",
      optionC: "要素C",
      optionD: "要素D",
      correctAnswer: "A",
      explanation: "要素Aが最も重要です。",
    },
    {
      questionText: "次のセキュリティ対策として適切なものはどれですか？",
      optionA: "対策A",
      optionB: "対策B",
      optionC: "対策C",
      optionD: "対策D",
      correctAnswer: "C",
      explanation: "対策Cが適切です。",
    },
    {
      questionText: "次のデータベース設計で正しいものはどれですか？",
      optionA: "設計A",
      optionB: "設計B",
      optionC: "設計C",
      optionD: "設計D",
      correctAnswer: "D",
      explanation: "設計Dが正しいです。",
    },
    {
      questionText: "次のネットワーク構成として適切なものはどれですか？",
      optionA: "構成A",
      optionB: "構成B",
      optionC: "構成C",
      optionD: "構成D",
      correctAnswer: "B",
      explanation: "構成Bが適切です。",
    },
    {
      questionText: "次のアルゴリズムで効率的なものはどれですか？",
      optionA: "アルゴリズムA",
      optionB: "アルゴリズムB",
      optionC: "アルゴリズムC",
      optionD: "アルゴリズムD",
      correctAnswer: "A",
      explanation: "アルゴリズムAが最も効率的です。",
    },
    {
      questionText: "次のテスト手法として正しいものはどれですか？",
      optionA: "手法A",
      optionB: "手法B",
      optionC: "手法C",
      optionD: "手法D",
      correctAnswer: "C",
      explanation: "手法Cが正しいテスト手法です。",
    },
  ];

  for (let i = 0; i < examPm1Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: examPm1.id,
      ...examPm1Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${examPm1Questions.length} questions for 応用情報午後 section 1`);

  // 応用情報試験：午後のセクション2
  const [examPm2] = await db
    .insert(sections)
    .values({
      examId: exam2.id,
      title: "応用情報午後#02",
      description: "午後問題：応用編",
      order: 2,
    })
    .returning();

  console.log(`✅ Created section: ${examPm2.title}`);

  // 応用情報午後のセクション2の問題（7問）
  const examPm2Questions = [
    {
      questionText: "次のシステム開発プロセスとして正しいものはどれですか？",
      optionA: "プロセスA",
      optionB: "プロセスB",
      optionC: "プロセスC",
      optionD: "プロセスD",
      correctAnswer: "B",
      explanation: "プロセスBが正しいです。",
    },
    {
      questionText: "次の要件定義で重要なものはどれですか？",
      optionA: "定義A",
      optionB: "定義B",
      optionC: "定義C",
      optionD: "定義D",
      correctAnswer: "A",
      explanation: "定義Aが重要です。",
    },
    {
      questionText: "次のアーキテクチャパターンとして適切なものはどれですか？",
      optionA: "パターンA",
      optionB: "パターンB",
      optionC: "パターンC",
      optionD: "パターンD",
      correctAnswer: "C",
      explanation: "パターンCが適切です。",
    },
    {
      questionText: "次の運用保守で重要な指標はどれですか？",
      optionA: "指標A",
      optionB: "指標B",
      optionC: "指標C",
      optionD: "指標D",
      correctAnswer: "D",
      explanation: "指標Dが重要です。",
    },
    {
      questionText: "次の障害対応として正しいものはどれですか？",
      optionA: "対応A",
      optionB: "対応B",
      optionC: "対応C",
      optionD: "対応D",
      correctAnswer: "B",
      explanation: "対応Bが正しいです。",
    },
    {
      questionText: "次の性能改善策として効果的なものはどれですか？",
      optionA: "改善策A",
      optionB: "改善策B",
      optionC: "改善策C",
      optionD: "改善策D",
      correctAnswer: "A",
      explanation: "改善策Aが効果的です。",
    },
    {
      questionText: "次のドキュメント作成で重要なものはどれですか？",
      optionA: "項目A",
      optionB: "項目B",
      optionC: "項目C",
      optionD: "項目D",
      correctAnswer: "C",
      explanation: "項目Cが重要です。",
    },
  ];

  for (let i = 0; i < examPm2Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: examPm2.id,
      ...examPm2Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${examPm2Questions.length} questions for 応用情報午後 section 2`);

  // FP3級：午前のセクション1
  const [fp1] = await db
    .insert(sections)
    .values({
      examId: exam3.id,
      title: "FP3級午前#01",
      description: "金融基礎知識",
      order: 1,
    })
    .returning();

  console.log(`✅ Created section: ${fp1.title}`);

  // FP3級のセクション1の問題（7問）
  const fp1Questions = [
    {
      questionText: "次のうち、正しい金融用語はどれですか？",
      optionA: "用語A",
      optionB: "用語B",
      optionC: "用語C",
      optionD: "用語D",
      correctAnswer: "A",
      explanation: "用語Aが正しいです。",
    },
    {
      questionText: "次の投資商品で最もリスクが低いものはどれですか？",
      optionA: "商品A",
      optionB: "商品B",
      optionC: "商品C",
      optionD: "商品D",
      correctAnswer: "B",
      explanation: "商品Bが最もリスクが低いです。",
    },
    {
      questionText: "次の保険種類として正しいものはどれですか？",
      optionA: "保険A",
      optionB: "保険B",
      optionC: "保険C",
      optionD: "保険D",
      correctAnswer: "C",
      explanation: "保険Cが正しいです。",
    },
    {
      questionText: "次の税金計算で正しいものはどれですか？",
      optionA: "計算A",
      optionB: "計算B",
      optionC: "計算C",
      optionD: "計算D",
      correctAnswer: "D",
      explanation: "計算Dが正しいです。",
    },
    {
      questionText: "次のライフプランで推奨されるものはどれですか？",
      optionA: "プランA",
      optionB: "プランB",
      optionC: "プランC",
      optionD: "プランD",
      correctAnswer: "B",
      explanation: "プランBが推奨されます。",
    },
    {
      questionText: "次の相続手続きで正しいものはどれですか？",
      optionA: "手続きA",
      optionB: "手続きB",
      optionC: "手続きC",
      optionD: "手続きD",
      correctAnswer: "A",
      explanation: "手続きAが正しいです。",
    },
    {
      questionText: "次の年金制度として正しいものはどれですか？",
      optionA: "制度A",
      optionB: "制度B",
      optionC: "制度C",
      optionD: "制度D",
      correctAnswer: "C",
      explanation: "制度Cが正しいです。",
    },
  ];

  for (let i = 0; i < fp1Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: fp1.id,
      ...fp1Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${fp1Questions.length} questions for FP3級午前 section 1`);

  // FP3級：午前のセクション2
  const [fp2] = await db
    .insert(sections)
    .values({
      examId: exam3.id,
      title: "FP3級午前#02",
      description: "資産運用",
      order: 2,
    })
    .returning();

  console.log(`✅ Created section: ${fp2.title}`);

  // FP3級のセクション2の問題（7問）
  const fp2Questions = [
    {
      questionText: "次の資産配分で最も適切なものはどれですか？",
      optionA: "配分A",
      optionB: "配分B",
      optionC: "配分C",
      optionD: "配分D",
      correctAnswer: "B",
      explanation: "配分Bが最も適切です。",
    },
    {
      questionText: "次のNISA制度として正しいものはどれですか？",
      optionA: "制度A",
      optionB: "制度B",
      optionC: "制度C",
      optionD: "制度D",
      correctAnswer: "A",
      explanation: "制度Aが正しいです。",
    },
    {
      questionText: "次の債券投資で安全性が高いものはどれですか？",
      optionA: "債券A",
      optionB: "債券B",
      optionC: "債券C",
      optionD: "債券D",
      correctAnswer: "C",
      explanation: "債券Cが安全性が高いです。",
    },
    {
      questionText: "次の投資信託の特徴として正しいものはどれですか？",
      optionA: "特徴A",
      optionB: "特徴B",
      optionC: "特徴C",
      optionD: "特徴D",
      correctAnswer: "D",
      explanation: "特徴Dが正しいです。",
    },
    {
      questionText: "次の外貨投資のリスクはどれですか？",
      optionA: "リスクA",
      optionB: "リスクB",
      optionC: "リスクC",
      optionD: "リスクD",
      correctAnswer: "B",
      explanation: "リスクBが正しいです。",
    },
    {
      questionText: "次の不動産投資で重要な指標はどれですか？",
      optionA: "指標A",
      optionB: "指標B",
      optionC: "指標C",
      optionD: "指標D",
      correctAnswer: "A",
      explanation: "指標Aが重要です。",
    },
    {
      questionText: "次の分散投資の考え方として正しいものはどれですか？",
      optionA: "考え方A",
      optionB: "考え方B",
      optionC: "考え方C",
      optionD: "考え方D",
      correctAnswer: "C",
      explanation: "考え方Cが正しいです。",
    },
  ];

  for (let i = 0; i < fp2Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: fp2.id,
      ...fp2Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${fp2Questions.length} questions for FP3級午前 section 2`);

  // FP3級：午後のセクション1
  const [fp3] = await db
    .insert(sections)
    .values({
      examId: exam4.id,
      title: "FP3級午後#01",
      description: "ライフプランニング",
      order: 1,
    })
    .returning();

  console.log(`✅ Created section: ${fp3.title}`);

  // FP3級午後のセクション1の問題（7問）
  const fp3Questions = [
    {
      questionText: "次のライフイベント計画として適切なものはどれですか？",
      optionA: "計画A",
      optionB: "計画B",
      optionC: "計画C",
      optionD: "計画D",
      correctAnswer: "B",
      explanation: "計画Bが適切です。",
    },
    {
      questionText: "次の教育資金準備方法として推奨されるものはどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "A",
      explanation: "方法Aが推奨されます。",
    },
    {
      questionText: "次の住宅ローンで注意すべき点はどれですか？",
      optionA: "注意点A",
      optionB: "注意点B",
      optionC: "注意点C",
      optionD: "注意点D",
      correctAnswer: "C",
      explanation: "注意点Cが重要です。",
    },
    {
      questionText: "次の保険の見直しポイントはどれですか？",
      optionA: "ポイントA",
      optionB: "ポイントB",
      optionC: "ポイントC",
      optionD: "ポイントD",
      correctAnswer: "D",
      explanation: "ポイントDが重要です。",
    },
    {
      questionText: "次の老後資金準備として適切なものはどれですか？",
      optionA: "準備A",
      optionB: "準備B",
      optionC: "準備C",
      optionD: "準備D",
      correctAnswer: "B",
      explanation: "準備Bが適切です。",
    },
    {
      questionText: "次の相続対策として有効なものはどれですか？",
      optionA: "対策A",
      optionB: "対策B",
      optionC: "対策C",
      optionD: "対策D",
      correctAnswer: "A",
      explanation: "対策Aが有効です。",
    },
    {
      questionText: "次のリスク管理方法として正しいものはどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "C",
      explanation: "方法Cが正しいです。",
    },
  ];

  for (let i = 0; i < fp3Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: fp3.id,
      ...fp3Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${fp3Questions.length} questions for FP3級午後 section 1`);

  // FP3級：午後のセクション2
  const [fp4] = await db
    .insert(sections)
    .values({
      examId: exam4.id,
      title: "FP3級午後#02",
      description: "タックスプランニング",
      order: 2,
    })
    .returning();

  console.log(`✅ Created section: ${fp4.title}`);

  // FP3級午後のセクション2の問題（7問）
  const fp4Questions = [
    {
      questionText: "次の所得税計算として正しいものはどれですか？",
      optionA: "計算A",
      optionB: "計算B",
      optionC: "計算C",
      optionD: "計算D",
      correctAnswer: "B",
      explanation: "計算Bが正しいです。",
    },
    {
      questionText: "次の控除制度として利用できるものはどれですか？",
      optionA: "制度A",
      optionB: "制度B",
      optionC: "制度C",
      optionD: "制度D",
      correctAnswer: "A",
      explanation: "制度Aが利用できます。",
    },
    {
      questionText: "次の確定申告で必要な書類はどれですか？",
      optionA: "書類A",
      optionB: "書類B",
      optionC: "書類C",
      optionD: "書類D",
      correctAnswer: "C",
      explanation: "書類Cが必要です。",
    },
    {
      questionText: "次の節税対策として有効なものはどれですか？",
      optionA: "対策A",
      optionB: "対策B",
      optionC: "対策C",
      optionD: "対策D",
      correctAnswer: "D",
      explanation: "対策Dが有効です。",
    },
    {
      questionText: "次の贈与税の計算方法として正しいものはどれですか？",
      optionA: "方法A",
      optionB: "方法B",
      optionC: "方法C",
      optionD: "方法D",
      correctAnswer: "B",
      explanation: "方法Bが正しいです。",
    },
    {
      questionText: "次の住民税の仕組みとして正しいものはどれですか？",
      optionA: "仕組みA",
      optionB: "仕組みB",
      optionC: "仕組みC",
      optionD: "仕組みD",
      correctAnswer: "A",
      explanation: "仕組みAが正しいです。",
    },
    {
      questionText: "次の税制優遇措置として該当するものはどれですか？",
      optionA: "措置A",
      optionB: "措置B",
      optionC: "措置C",
      optionD: "措置D",
      correctAnswer: "C",
      explanation: "措置Cが該当します。",
    },
  ];

  for (let i = 0; i < fp4Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: fp4.id,
      ...fp4Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${fp4Questions.length} questions for FP3級午後 section 2`);

  console.log("🎉 Seeding completed!");
  console.log(`Total: 4 exams, 9 sections, 63 questions`);
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
