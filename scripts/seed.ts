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

  // 応用情報試験のセクション1の問題（7問）- テクノロジー系
  const section1Questions = [
    {
      questionText: "2進数10110を10進数に変換した値はどれか。",
      optionA: "18",
      optionB: "22",
      optionC: "26",
      optionD: "30",
      correctAnswer: "B",
      explanation: "10110(2) = 1×2⁴ + 0×2³ + 1×2² + 1×2¹ + 0×2⁰ = 16 + 4 + 2 = 22",
    },
    {
      questionText: "OSI参照モデルの第4層に相当するものはどれか。",
      optionA: "データリンク層",
      optionB: "ネットワーク層",
      optionC: "トランスポート層",
      optionD: "セッション層",
      correctAnswer: "C",
      explanation: "OSI参照モデルの第4層はトランスポート層です。TCP/UDPなどのプロトコルがこの層に該当します。",
    },
    {
      questionText: "SQLインジェクション攻撃への対策として最も適切なものはどれか。",
      optionA: "ファイアウォールを導入する",
      optionB: "入力値のバリデーションとエスケープ処理を行う",
      optionC: "HTTPSを使用する",
      optionD: "ウイルス対策ソフトを導入する",
      correctAnswer: "B",
      explanation: "SQLインジェクション対策には、入力値の検証とエスケープ処理、プリペアドステートメントの使用が有効です。",
    },
    {
      questionText: "UMLで使用されるクラス間の関係で、'has-a'の関係を表すものはどれか。",
      optionA: "汎化",
      optionB: "実現",
      optionC: "集約",
      optionD: "依存",
      correctAnswer: "C",
      explanation: "集約(Aggregation)は'has-a'の関係を表し、全体と部分の関係を示します。",
    },
    {
      questionText: "RAIDのレベルで、データの冗長性を持たず、ストライピングのみを行うものはどれか。",
      optionA: "RAID 0",
      optionB: "RAID 1",
      optionC: "RAID 5",
      optionD: "RAID 6",
      correctAnswer: "A",
      explanation: "RAID 0は冗長性を持たず、複数のディスクにデータを分散して書き込むストライピングのみを行います。",
    },
    {
      questionText: "正規化において、第2正規形から第3正規形にする際に除去する従属性はどれか。",
      optionA: "部分関数従属",
      optionB: "推移的関数従属",
      optionC: "完全関数従属",
      optionD: "多値従属",
      correctAnswer: "B",
      explanation: "第3正規形は推移的関数従属を除去することで達成されます。",
    },
    {
      questionText: "スタックのデータ構造で使用されるアクセス方式はどれか。",
      optionA: "FIFO",
      optionB: "LIFO",
      optionC: "ランダムアクセス",
      optionD: "シーケンシャルアクセス",
      correctAnswer: "B",
      explanation: "スタックはLIFO(Last In First Out)方式でデータにアクセスします。最後に入れたデータを最初に取り出します。",
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

  // 応用情報試験のセクション2の問題（7問）- マネジメント系
  const section2Questions = [
    {
      questionText: "プロジェクトマネジメントにおけるWBSの説明として適切なものはどれか。",
      optionA: "作業の進捗を管理するための工程表",
      optionB: "プロジェクトの作業を階層的に分解した構造",
      optionC: "組織の役割と責任を定義した図",
      optionD: "リスクの優先順位を付けた一覧表",
      correctAnswer: "B",
      explanation: "WBS(Work Breakdown Structure)はプロジェクトの作業を階層的に分解したもので、成果物ベースで構成されます。",
    },
    {
      questionText: "アジャイル開発の特徴として適切でないものはどれか。",
      optionA: "短い反復サイクルで開発を進める",
      optionB: "プロジェクト開始時にすべての要件を確定させる",
      optionC: "顧客とのコミュニケーションを重視する",
      optionD: "変化への対応を重視する",
      correctAnswer: "B",
      explanation: "アジャイル開発では、要件の変化に柔軟に対応することを重視します。すべての要件を最初に確定させるのはウォーターフォール型の特徴です。",
    },
    {
      questionText: "情報セキュリティのCIA三要素に含まれないものはどれか。",
      optionA: "機密性(Confidentiality)",
      optionB: "完全性(Integrity)",
      optionC: "可用性(Availability)",
      optionD: "透明性(Transparency)",
      correctAnswer: "D",
      explanation: "情報セキュリティの三要素は機密性、完全性、可用性です。透明性は含まれません。",
    },
    {
      questionText: "PDCAサイクルにおいて、'Check'で行うべき活動はどれか。",
      optionA: "目標を設定し計画を立てる",
      optionB: "計画に基づいて実行する",
      optionC: "実行結果を評価し分析する",
      optionD: "改善策を実施する",
      correctAnswer: "C",
      explanation: "Check(評価)では、Do(実行)の結果を測定し、Plan(計画)と比較して評価・分析します。",
    },
    {
      questionText: "システム監査において、監査人が最も重視すべき独立性の種類はどれか。",
      optionA: "組織上の独立性",
      optionB: "財務上の独立性",
      optionC: "精神上の独立性",
      optionD: "技術上の独立性",
      correctAnswer: "C",
      explanation: "監査人にとって最も重要なのは精神上の独立性(実質的独立性)です。公正不偏な態度で監査を実施することが求められます。",
    },
    {
      questionText: "ITILにおけるインシデント管理の主な目的はどれか。",
      optionA: "問題の根本原因を特定し解決する",
      optionB: "できるだけ早くサービスを正常な状態に復旧する",
      optionC: "変更によるリスクを評価する",
      optionD: "サービスレベルの達成状況を監視する",
      correctAnswer: "B",
      explanation: "インシデント管理の目的は、サービスの中断を最小限に抑え、できるだけ早く正常な状態に復旧することです。",
    },
    {
      questionText: "SLAの説明として適切なものはどれか。",
      optionA: "システム開発の工程と成果物を定めた文書",
      optionB: "サービス提供者と利用者の間で合意したサービスレベルを定めた文書",
      optionC: "システムの運用手順を記載したマニュアル",
      optionD: "障害発生時の対応手順を定めた文書",
      correctAnswer: "B",
      explanation: "SLA(Service Level Agreement)は、サービス提供者と利用者の間で合意したサービスレベルを定めた契約書です。",
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

  // 応用情報試験のセクション3の問題（7問）- ストラテジ系
  const section3Questions = [
    {
      questionText: "企業の経営戦略において、SWOT分析のSは何を表すか。",
      optionA: "Strategy（戦略）",
      optionB: "Strength（強み）",
      optionC: "System（システム）",
      optionD: "Standard（標準）",
      correctAnswer: "B",
      explanation: "SWOT分析は、Strength(強み)、Weakness(弱み)、Opportunity(機会)、Threat(脅威)の頭文字です。",
    },
    {
      questionText: "損益分岐点の計算式として正しいものはどれか。",
      optionA: "固定費 ÷ (売上高 - 変動費)",
      optionB: "固定費 ÷ (販売単価 - 変動費率)",
      optionC: "固定費 ÷ (1 - 変動費率)",
      optionD: "固定費 ÷ 限界利益率",
      correctAnswer: "D",
      explanation: "損益分岐点売上高 = 固定費 ÷ 限界利益率です。限界利益率 = (売上高 - 変動費) ÷ 売上高で求められます。",
    },
    {
      questionText: "知的財産権のうち、産業財産権に含まれないものはどれか。",
      optionA: "特許権",
      optionB: "実用新案権",
      optionC: "著作権",
      optionD: "商標権",
      correctAnswer: "C",
      explanation: "産業財産権は特許権、実用新案権、意匠権、商標権の4つです。著作権は産業財産権には含まれません。",
    },
    {
      questionText: "マーケティングミックスの4Pに含まれないものはどれか。",
      optionA: "Product（製品）",
      optionB: "Price（価格）",
      optionC: "Place（流通）",
      optionD: "People（人材）",
      correctAnswer: "D",
      explanation: "マーケティングミックスの4PはProduct、Price、Place、Promotion（プロモーション）です。",
    },
    {
      questionText: "ROI(投資利益率)の計算式として正しいものはどれか。",
      optionA: "利益 ÷ 売上高 × 100",
      optionB: "利益 ÷ 投資額 × 100",
      optionC: "売上高 ÷ 投資額 × 100",
      optionD: "投資額 ÷ 利益 × 100",
      correctAnswer: "B",
      explanation: "ROI(Return On Investment) = 利益 ÷ 投資額 × 100 で計算されます。投資効率を測る指標です。",
    },
    {
      questionText: "BCP(事業継続計画)の主な目的はどれか。",
      optionA: "企業の利益を最大化する",
      optionB: "災害発生時でも重要業務を継続または早期復旧する",
      optionC: "情報セキュリティを強化する",
      optionD: "業務プロセスを効率化する",
      correctAnswer: "B",
      explanation: "BCP(Business Continuity Plan)は、災害や事故が発生した場合でも重要な業務を継続させ、または早期に復旧させるための計画です。",
    },
    {
      questionText: "個人情報保護法において、個人情報取扱事業者が行うべき義務に該当しないものはどれか。",
      optionA: "利用目的の特定と通知",
      optionB: "安全管理措置の実施",
      optionC: "本人からの開示請求への対応",
      optionD: "全従業員の個人情報の公開",
      correctAnswer: "D",
      explanation: "個人情報取扱事業者には適切な管理と本人の権利保護が求められますが、従業員の個人情報を公開する義務はありません。",
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

  // 応用情報午後のセクション1の問題（7問）- データベース設計
  const examPm1Questions = [
    {
      questionText: "正規化の目的として適切なものはどれか。",
      optionA: "データの検索速度を向上させる",
      optionB: "データの冗長性を排除し、データの一貫性を保つ",
      optionC: "データベースのセキュリティを強化する",
      optionD: "ストレージの使用量を削減する",
      correctAnswer: "B",
      explanation: "正規化の主な目的は、データの冗長性を排除し、更新時の異常を防ぎ、データの一貫性を保つことです。",
    },
    {
      questionText: "次のSQL文でINNER JOINとLEFT JOINの違いを説明したものとして正しいものはどれか。",
      optionA: "INNER JOINは結合条件に一致する行のみ、LEFT JOINは左テーブルの全行を返す",
      optionB: "INNER JOINは左テーブルの全行、LEFT JOINは右テーブルの全行を返す",
      optionC: "INNER JOINは高速、LEFT JOINは低速である",
      optionD: "INNER JOINとLEFT JOINに違いはない",
      correctAnswer: "A",
      explanation: "INNER JOINは結合条件に一致する行のみを返し、LEFT JOINは左テーブルの全行を返し、右テーブルに一致する行がない場合はNULLを返します。",
    },
    {
      questionText: "トランザクションのACID特性のうち、'I'は何を表すか。",
      optionA: "Atomicity（原子性）",
      optionB: "Consistency（一貫性）",
      optionC: "Isolation（独立性）",
      optionD: "Durability（永続性）",
      correctAnswer: "C",
      explanation: "ACIDのIはIsolation（独立性・分離性）を表します。複数のトランザクションが同時に実行されても互いに影響を与えないことを保証します。",
    },
    {
      questionText: "インデックスを作成する主な目的はどれか。",
      optionA: "データの重複を防ぐ",
      optionB: "検索性能を向上させる",
      optionC: "データの整合性を保証する",
      optionD: "ストレージ容量を節約する",
      correctAnswer: "B",
      explanation: "インデックスは検索性能を向上させるためのデータ構造です。ただし、更新処理のオーバーヘッドが増加することに注意が必要です。",
    },
    {
      questionText: "ERDにおいて、エンティティ間のカーディナリティが「1:多」を表す関係はどれか。",
      optionA: "一人の顧客が複数の注文を行う",
      optionB: "一つの注文に複数の商品が含まれ、一つの商品は複数の注文に含まれる",
      optionC: "一人の社員が一つの部署に所属する",
      optionD: "一つの部署に一人の部長がいる",
      correctAnswer: "A",
      explanation: "「顧客」と「注文」の関係は1:多です。一人の顧客は複数の注文を行えますが、一つの注文は一人の顧客に属します。",
    },
    {
      questionText: "デッドロックを防ぐ方法として適切でないものはどれか。",
      optionA: "トランザクションが複数のリソースを獲得する順序を統一する",
      optionB: "トランザクションの実行時間を短くする",
      optionC: "すべてのトランザクションを直列に実行する",
      optionD: "すべてのトランザクションに共有ロックを使用する",
      correctAnswer: "D",
      explanation: "すべてに共有ロックを使用すると、更新ができなくなります。デッドロック防止には、ロック順序の統一、タイムアウトの設定などが有効です。",
    },
    {
      questionText: "データウェアハウスの特徴として適切なものはどれか。",
      optionA: "リアルタイムでのトランザクション処理に最適化されている",
      optionB: "過去のデータを統合し、分析用に最適化されている",
      optionC: "データの正規化を徹底している",
      optionD: "小規模なデータの管理に適している",
      correctAnswer: "B",
      explanation: "データウェアハウスは、複数のソースから統合された過去のデータを保持し、意思決定支援のための分析に最適化されています。",
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

  // 応用情報午後のセクション2の問題（7問）- ネットワークとセキュリティ
  const examPm2Questions = [
    {
      questionText: "IPアドレス192.168.1.0/24のネットワークで利用可能なホストアドレスの数はどれか。",
      optionA: "254",
      optionB: "255",
      optionC: "256",
      optionD: "512",
      correctAnswer: "A",
      explanation: "/24は256個のアドレスですが、ネットワークアドレス(192.168.1.0)とブロードキャストアドレス(192.168.1.255)を除くと254個のホストアドレスが利用可能です。",
    },
    {
      questionText: "HTTPSで使用されるデフォルトのポート番号はどれか。",
      optionA: "80",
      optionB: "443",
      optionC: "8080",
      optionD: "8443",
      correctAnswer: "B",
      explanation: "HTTPSのデフォルトポート番号は443です。HTTPは80、FTPは21、SSHは22を使用します。",
    },
    {
      questionText: "ファイアウォールのステートフルインスペクションの説明として正しいものはどれか。",
      optionA: "パケットのヘッダ情報のみを検査する",
      optionB: "通信の状態を記憶し、関連する通信を許可する",
      optionC: "アプリケーション層のデータを解析する",
      optionD: "すべてのパケットを無条件で通過させる",
      correctAnswer: "B",
      explanation: "ステートフルインスペクションは、通信のセッション情報を記憶し、確立された通信に関連する応答パケットを許可する方式です。",
    },
    {
      questionText: "公開鍵暗号方式の特徴として正しいものはどれか。",
      optionA: "暗号化と復号に同じ鍵を使用する",
      optionB: "暗号化に公開鍵、復号に秘密鍵を使用する",
      optionC: "共通鍵暗号より処理速度が速い",
      optionD: "鍵の配送問題が発生する",
      correctAnswer: "B",
      explanation: "公開鍵暗号方式では、暗号化に公開鍵、復号に秘密鍵を使用します。デジタル署名では逆に秘密鍵で署名し、公開鍵で検証します。",
    },
    {
      questionText: "DNSキャッシュポイズニングの対策として有効なものはどれか。",
      optionA: "ファイアウォールの導入",
      optionB: "DNSSEC の実装",
      optionC: "HTTPSの使用",
      optionD: "ウイルス対策ソフトの導入",
      correctAnswer: "B",
      explanation: "DNSSECはDNS応答にデジタル署名を付加することで、DNSキャッシュポイズニング攻撃を防ぎます。",
    },
    {
      questionText: "VLANを導入する主な目的として適切でないものはどれか。",
      optionA: "ブロードキャストドメインを分割する",
      optionB: "セキュリティを向上させる",
      optionC: "ネットワークの論理的な分割",
      optionD: "インターネット接続速度を向上させる",
      correctAnswer: "D",
      explanation: "VLANは物理的な配線に依存せずにネットワークを論理的に分割しますが、インターネット接続速度の向上とは直接関係ありません。",
    },
    {
      questionText: "IDS(侵入検知システム)とIPS(侵入防止システム)の違いとして正しいものはどれか。",
      optionA: "IDSは検知のみ、IPSは検知と遮断を行う",
      optionB: "IDSは遮断を行い、IPSは検知のみを行う",
      optionC: "IDSとIPSは同じ機能を持つ",
      optionD: "IDSはハードウェア、IPSはソフトウェア",
      correctAnswer: "A",
      explanation: "IDSは不正アクセスを検知して警告するのみですが、IPSは検知に加えて自動的に遮断や防御を行います。",
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

  // 応用情報試験：午後のセクション3
  const [examPm3] = await db
    .insert(sections)
    .values({
      examId: exam2.id,
      title: "応用情報午後#03",
      description: "午後問題：アルゴリズムとプログラミング",
      order: 3,
    })
    .returning();

  console.log(`✅ Created section: ${examPm3.title}`);

  // 応用情報午後のセクション3の問題（7問）- アルゴリズムとプログラミング
  const examPm3Questions = [
    {
      questionText: "バブルソートの時間計算量はどれか。",
      optionA: "O(n)",
      optionB: "O(n log n)",
      optionC: "O(n²)",
      optionD: "O(2ⁿ)",
      correctAnswer: "C",
      explanation: "バブルソートは隣接する要素を比較して交換を繰り返すため、最悪の場合と平均的な場合の時間計算量はO(n²)です。",
    },
    {
      questionText: "二分探索木で要素を探索する際の平均的な時間計算量はどれか。",
      optionA: "O(1)",
      optionB: "O(log n)",
      optionC: "O(n)",
      optionD: "O(n log n)",
      correctAnswer: "B",
      explanation: "平衡が取れた二分探索木では、探索の時間計算量はO(log n)です。ただし、偏った木ではO(n)になることがあります。",
    },
    {
      questionText: "再帰処理において、無限ループを防ぐために必要なものはどれか。",
      optionA: "ループカウンタ",
      optionB: "基底条件（終了条件）",
      optionC: "グローバル変数",
      optionD: "例外処理",
      correctAnswer: "B",
      explanation: "再帰処理では基底条件（終了条件）が必須です。これにより再帰呼び出しが終了し、無限ループを防ぎます。",
    },
    {
      questionText: "ハッシュテーブルで衝突（collision）が発生した場合の解決方法に含まれないものはどれか。",
      optionA: "チェイン法",
      optionB: "オープンアドレス法",
      optionC: "再ハッシュ法",
      optionD: "二分探索法",
      correctAnswer: "D",
      explanation: "二分探索法は衝突解決法ではありません。チェイン法、オープンアドレス法、再ハッシュ法がハッシュの衝突解決法として使われます。",
    },
    {
      questionText: "深さ優先探索(DFS)で使用する主なデータ構造はどれか。",
      optionA: "キュー",
      optionB: "スタック",
      optionC: "ヒープ",
      optionD: "ハッシュテーブル",
      correctAnswer: "B",
      explanation: "深さ優先探索ではスタック（または再帰）を使用します。幅優先探索ではキューを使用します。",
    },
    {
      questionText: "動的計画法の特徴として正しいものはどれか。",
      optionA: "問題を分割し、部分問題の解を記憶して再利用する",
      optionB: "常に最速のアルゴリズムである",
      optionC: "メモリを全く使用しない",
      optionD: "並列処理に適している",
      correctAnswer: "A",
      explanation: "動的計画法は問題を部分問題に分割し、その解をメモ化（記憶）して再利用することで、重複計算を避けて効率化します。",
    },
    {
      questionText: "オブジェクト指向プログラミングにおける'ポリモーフィズム'の説明として正しいものはどれか。",
      optionA: "データと処理を一つにまとめること",
      optionB: "クラスの内部実装を隠蔽すること",
      optionC: "同じインターフェースで異なる実装を持つこと",
      optionD: "既存のクラスから新しいクラスを作成すること",
      correctAnswer: "C",
      explanation: "ポリモーフィズム（多態性）は、同じインターフェースや基底クラスを通じて、異なる実装を持つオブジェクトを扱える特性です。",
    },
  ];

  for (let i = 0; i < examPm3Questions.length; i++) {
    await db.insert(questions).values({
      sectionId: examPm3.id,
      ...examPm3Questions[i],
      order: i + 1,
    });
  }

  console.log(`✅ Created ${examPm3Questions.length} questions for 応用情報午後 section 3`);

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
  console.log(`Total: 4 exams, 10 sections, 70 questions`);
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
