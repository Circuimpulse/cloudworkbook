import { db } from "./client";
import {
  questions,
  sections,
  sectionProgress,
  sectionQuestionProgress,
  mockTestHistory,
  mockTestDetails,
  users,
  userQuestionRecords,
  exams,
  favoriteSettings,
} from "./schema";
import { eq, and, sql, desc, or } from "drizzle-orm";

/**
 * クエリ関数集
 * ビジネスロジックをここに集約し、API Routeをシンプルに保つ
 */

// ==================== ユーザー関連 ====================

export async function createUser(userId: string, email: string, name?: string) {
  return db.insert(users).values({ id: userId, email, name }).returning();
}

export async function getUserById(userId: string) {
  return db.select().from(users).where(eq(users.id, userId)).get();
}

// ==================== 試験区分関連 ====================

export async function getAllExams() {
  return db.select().from(exams).all();
}

export async function getExamById(id: number) {
  return db.select().from(exams).where(eq(exams.id, id)).get();
}

export async function getSectionsByExamId(examId: number) {
  return db
    .select()
    .from(sections)
    .where(eq(sections.examId, examId))
    .orderBy(sections.order)
    .all();
}

export async function getSectionWithExam(sectionId: number) {
  const result = await db
    .select({
      section: sections,
      exam: exams,
    })
    .from(sections)
    .leftJoin(exams, eq(sections.examId, exams.id))
    .where(eq(sections.id, sectionId))
    .get();

  return result;
}

export async function getAdjacentSections(sectionId: number) {
  // 現在のセクションを取得
  const currentSection = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId))
    .get();

  if (!currentSection || !currentSection.examId) {
    return { prevSection: null, nextSection: null };
  }

  // 同じ試験区分のセクションを取得
  const examSections = await db
    .select()
    .from(sections)
    .where(eq(sections.examId, currentSection.examId))
    .orderBy(sections.order)
    .all();

  const currentIndex = examSections.findIndex((s) => s.id === sectionId);

  const prevSection = currentIndex > 0 ? examSections[currentIndex - 1] : null;
  const nextSection =
    currentIndex < examSections.length - 1
      ? examSections[currentIndex + 1]
      : null;

  return { prevSection, nextSection };
}

export async function getAllSectionsWithExams() {
  return db
    .select({
      section: sections,
      exam: exams,
    })
    .from(sections)
    .leftJoin(exams, eq(sections.examId, exams.id))
    .orderBy(sections.order)
    .all();
}

// ==================== セクション関連 ====================

export async function getAllSections() {
  return db.select().from(sections).orderBy(sections.order).all();
}

export async function getSectionById(id: number) {
  return db.select().from(sections).where(eq(sections.id, id)).get();
}

export async function getQuestionsBySection(sectionId: number) {
  return db
    .select()
    .from(questions)
    .where(eq(questions.sectionId, sectionId))
    .orderBy(questions.order)
    .all();
}

// ==================== 学習進捗関連 ====================

export async function getSectionProgress(userId: string, sectionId: number) {
  return db
    .select()
    .from(sectionProgress)
    .where(
      and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.sectionId, sectionId),
      ),
    )
    .get();
}

export async function getAllSectionProgress(userId: string) {
  return db
    .select()
    .from(sectionProgress)
    .where(eq(sectionProgress.userId, userId))
    .all();
}

export async function upsertSectionProgress(
  userId: string,
  sectionId: number,
  correctCount: number,
  totalCount: number,
) {
  // SQLite の INSERT OR REPLACE を使用
  return db
    .insert(sectionProgress)
    .values({
      userId,
      sectionId,
      correctCount,
      totalCount,
      lastStudiedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [sectionProgress.userId, sectionProgress.sectionId],
      set: {
        correctCount,
        totalCount,
        lastStudiedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();
}

// ==================== 模擬テスト関連 ====================

/**
 * ランダムに50問取得
 * SQLite互換のRANDOM()を使用（D1でも動作）
 */
export async function getRandomQuestions(limit: number = 50, examId?: number) {
  if (examId) {
    return db
      .select({
        id: questions.id,
        sectionId: questions.sectionId,
        questionText: questions.questionText,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        order: questions.order,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .innerJoin(sections, eq(questions.sectionId, sections.id))
      .where(eq(sections.examId, examId))
      .orderBy(sql`RANDOM()`)
      .limit(limit)
      .all();
  }
  return db
    .select()
    .from(questions)
    .orderBy(sql`RANDOM()`)
    .limit(limit)
    .all();
}

/**
 * 模擬テスト履歴を作成
 */
export async function createMockTest(
  userId: string,
  score: number,
  totalQuestions: number = 50,
) {
  const result = await db
    .insert(mockTestHistory)
    .values({
      userId,
      score,
      totalQuestions,
      takenAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * 模擬テスト詳細を一括挿入
 */
export async function insertMockTestDetails(
  testId: number,
  details: Array<{
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
  }>,
) {
  return db
    .insert(mockTestDetails)
    .values(
      details.map((detail) => ({
        testId,
        questionId: detail.questionId,
        userAnswer: detail.userAnswer,
        isCorrect: detail.isCorrect,
        answeredAt: new Date(),
      })),
    )
    .returning();
}

/**
 * ユーザーの模擬テスト履歴を取得
 */
export async function getMockTestHistory(userId: string, limit: number = 10) {
  return db
    .select()
    .from(mockTestHistory)
    .where(eq(mockTestHistory.userId, userId))
    .orderBy(desc(mockTestHistory.takenAt))
    .limit(limit)
    .all();
}

/**
 * 特定の模擬テストの詳細を取得
 */
export async function getMockTestDetails(testId: number) {
  return db
    .select({
      id: mockTestDetails.id,
      questionId: mockTestDetails.questionId,
      userAnswer: mockTestDetails.userAnswer,
      isCorrect: mockTestDetails.isCorrect,
      answeredAt: mockTestDetails.answeredAt,
      question: questions,
    })
    .from(mockTestDetails)
    .leftJoin(questions, eq(mockTestDetails.questionId, questions.id))
    .where(eq(mockTestDetails.testId, testId))
    .all();
}

// ==================== 管理者用（初期データ投入など） ====================

export async function createSection(
  title: string,
  description: string,
  order: number,
) {
  return db.insert(sections).values({ title, description, order }).returning();
}

export async function createQuestion(
  sectionId: number,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctAnswer: string,
  explanation: string,
  order: number,
) {
  return db
    .insert(questions)
    .values({
      sectionId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      order,
    })
    .returning();
}

// ==================== セクション問題別進捗関連 ====================

/**
 * 特定セクションの問題ごとの進捗を取得
 */
export async function getSectionQuestionsProgress(
  userId: string,
  sectionId: number,
) {
  return db
    .select()
    .from(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
      ),
    )
    .all();
}

/**
 * 問題ごとの進捗を保存（上書き）
 */
type UpsertSectionQuestionProgressResult = Promise<
  {
    updatedAt: Date;
    userId: string;
    sectionId: number;
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
  }[]
>;

export async function upsertSectionQuestionProgress(
  userId: string,
  sectionId: number,
  questionId: number,
  userAnswer: string,
  isCorrect: boolean,
): UpsertSectionQuestionProgressResult {
  return db
    .insert(sectionQuestionProgress)
    .values({
      userId,
      sectionId,
      questionId,
      userAnswer,
      isCorrect,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        sectionQuestionProgress.userId,
        sectionQuestionProgress.sectionId,
        sectionQuestionProgress.questionId,
      ],
      set: {
        userAnswer,
        isCorrect,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * ユーザーの全てのセクション問題別進捗を取得 (リスト画面用)
 */
export async function getAllSectionQuestionsProgress(userId: string) {
  return db
    .select()
    .from(sectionQuestionProgress)
    .where(eq(sectionQuestionProgress.userId, userId))
    .all();
}

/**
 * ユーザーごとの問題記録（履歴）を保存
 * 間違えた問題のみを記録し、正解した場合は既存のレコードを削除しない
 * これにより、一度でも間違えた問題は学習履歴に残り続ける
 */
export async function upsertUserQuestionRecord(
  userId: string,
  questionId: number,
  isCorrect: boolean,
) {
  // 間違えた場合のみ記録を作成/更新
  if (!isCorrect) {
    return db
      .insert(userQuestionRecords)
      .values({
        userId,
        questionId,
        isCorrect: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userQuestionRecords.userId, userQuestionRecords.questionId],
        set: {
          isCorrect: false,
          updatedAt: new Date(),
        },
      })
      .returning();
  }
  
  // 正解した場合は何もしない（既存の間違い記録を保持）
  return [];
}

/**
 * セクション進捗のリセット（Homeに戻ったとき用）
 */
export async function resetSectionProgress(userId: string, sectionId: number) {
  // sectionQuestionProgressを削除
  await db
    .delete(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
      ),
    );

  // sectionProgressも削除
  return db
    .delete(sectionProgress)
    .where(
      and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.sectionId, sectionId),
      ),
    );
}

/**
 * セクションの間違った問題IDを取得
 * userQuestionRecordsから取得（永続的な履歴）
 */
export async function getIncorrectQuestionIds(
  userId: string,
  sectionId: number,
) {
  // userQuestionRecordsから間違えた問題を取得
  const records = await db
    .select()
    .from(userQuestionRecords)
    .innerJoin(questions, eq(userQuestionRecords.questionId, questions.id))
    .where(
      and(
        eq(userQuestionRecords.userId, userId),
        eq(userQuestionRecords.isCorrect, false),
        eq(questions.sectionId, sectionId),
      ),
    )
    .all();

  return records.map((r) => r.user_question_records.questionId);
}

/**
 * 正解した問題を除外して、間違った問題のみをリセット
 */
export async function resetIncorrectQuestionsOnly(
  userId: string,
  sectionId: number,
) {
  // 間違った問題の進捗を削除
  await db
    .delete(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
        eq(sectionQuestionProgress.isCorrect, false),
      ),
    );

  // sectionProgressを更新（正解数のみ残す）
  const correctCount = (
    await db
      .select()
      .from(sectionQuestionProgress)
      .where(
        and(
          eq(sectionQuestionProgress.userId, userId),
          eq(sectionQuestionProgress.sectionId, sectionId),
          eq(sectionQuestionProgress.isCorrect, true),
        ),
      )
      .all()
  ).length;

  return db
    .update(sectionProgress)
    .set({
      correctCount: correctCount,
      totalCount: correctCount, // 間違った問題はリセットされたので、解答数＝正解数になるはず
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.sectionId, sectionId),
      ),
    );
}

/**
 * 特定の問題の進捗をリセットする
 */
export async function resetQuestionProgress(
  userId: string,
  sectionId: number,
  questionId: number,
) {
  // 指定された問題の進捗を削除
  await db
    .delete(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
        eq(sectionQuestionProgress.questionId, questionId),
      ),
    );

  // 全進捗を取得して集計し直す
  const allProgress = await db
    .select()
    .from(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
      ),
    )
    .all();

  const correctCount = allProgress.filter((p) => p.isCorrect).length;
  const totalCount = allProgress.length;

  return db
    .insert(sectionProgress)
    .values({
      userId,
      sectionId,
      correctCount,
      totalCount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [sectionProgress.userId, sectionProgress.sectionId],
      set: {
        correctCount,
        totalCount,
        updatedAt: new Date(),
      },
    });
}

/**
 * 試験ごとの間違えた問題を取得（セクションごとにグループ化）
 * userQuestionRecordsから取得（永続的な履歴）
 */
export async function getIncorrectQuestionsByExam(
  userId: string,
  examId: number,
) {
  // 試験に属する全セクションを取得
  const examSections = await getSectionsByExamId(examId);

  const result = [];

  for (const section of examSections) {
    // userQuestionRecordsから間違えた問題を取得（永続的な履歴）
    const incorrectRecords = await db
      .select()
      .from(userQuestionRecords)
      .innerJoin(questions, eq(userQuestionRecords.questionId, questions.id))
      .where(
        and(
          eq(userQuestionRecords.userId, userId),
          eq(userQuestionRecords.isCorrect, false),
          eq(questions.sectionId, section.id),
        ),
      )
      .all();

    if (incorrectRecords.length > 0) {
      const incorrectQuestions = incorrectRecords.map((r) => r.questions);

      result.push({
        section,
        questions: incorrectQuestions,
      });
    }
  }

  return result;
}

/**
 * 試験ごとのお気に入り問題を取得（セクションごとにグループ化）
 */
export async function getFavoriteQuestionsByExam(
  userId: string,
  examId: number,
) {
  // 試験に属する全セクションを取得
  const examSections = await getSectionsByExamId(examId);

  const result = [];

  for (const section of examSections) {
    // セクションごとのお気に入り問題を取得
    const favoriteQuestions = await getFavoriteQuestionsBySection(
      userId,
      section.id,
    );

    if (favoriteQuestions.length > 0) {
      result.push({
        section,
        questions: favoriteQuestions,
      });
    }
  }

  return result;
}

// ==================== お気に入り関連 ====================

/**
 * お気に入り状態を取得
 */
export async function getFavoriteStatus(userId: string, questionId: number) {
  const record = await db
    .select()
    .from(userQuestionRecords)
    .where(
      and(
        eq(userQuestionRecords.userId, userId),
        eq(userQuestionRecords.questionId, questionId),
      ),
    )
    .get();

  return {
    isFavorite1: record?.isFavorite1 ?? false,
    isFavorite2: record?.isFavorite2 ?? false,
    isFavorite3: record?.isFavorite3 ?? false,
    // Legacy support
    isFavorite: record?.isFavorite ?? false,
  };
}

/**
 * お気に入り状態をトグル（レベル指定可能）
 */
export async function toggleFavorite(
  userId: string,
  questionId: number,
  level: number = 1,
) {
  const existing = await db
    .select()
    .from(userQuestionRecords)
    .where(
      and(
        eq(userQuestionRecords.userId, userId),
        eq(userQuestionRecords.questionId, questionId),
      ),
    )
    .get();

  if (existing) {
    // 既存レコードがある場合は更新
    const updates: any = {
      updatedAt: new Date(),
    };

    if (level === 1) updates.isFavorite1 = !existing.isFavorite1;
    if (level === 2) updates.isFavorite2 = !existing.isFavorite2;
    if (level === 3) updates.isFavorite3 = !existing.isFavorite3;
    // レガシーフラグも更新（1の場合は連動させるなど）
    if (level === 1) updates.isFavorite = !existing.isFavorite1;

    return db
      .update(userQuestionRecords)
      .set(updates)
      .where(
        and(
          eq(userQuestionRecords.userId, userId),
          eq(userQuestionRecords.questionId, questionId),
        ),
      )
      .returning();
  } else {
    // 新規レコードを作成
    const newRecord: any = {
      userId,
      questionId,
      updatedAt: new Date(),
      isFavorite: false,
      isFavorite1: false,
      isFavorite2: false,
      isFavorite3: false,
    };

    if (level === 1) {
      newRecord.isFavorite1 = true;
      newRecord.isFavorite = true;
    }
    if (level === 2) newRecord.isFavorite2 = true;
    if (level === 3) newRecord.isFavorite3 = true;

    return db.insert(userQuestionRecords).values(newRecord).returning();
  }
}

/**
 * ユーザーのお気に入り問題IDリストを取得
 * 設定に基づいてフィルタリング
 */
export async function getFavoriteQuestionIds(userId: string) {
  // 設定を取得
  const settings = await getFavoriteSettings(userId);
  
  // デフォルト設定
  const favorite1Enabled = settings?.favorite1Enabled ?? true;
  const favorite2Enabled = settings?.favorite2Enabled ?? true;
  const favorite3Enabled = settings?.favorite3Enabled ?? true;
  const filterMode = settings?.filterMode ?? "or";

  const records = await db
    .select()
    .from(userQuestionRecords)
    .where(eq(userQuestionRecords.userId, userId))
    .all();

  return records
    .filter((r) => {
      const matches = [];
      if (favorite1Enabled && r.isFavorite1) matches.push(true);
      if (favorite2Enabled && r.isFavorite2) matches.push(true);
      if (favorite3Enabled && r.isFavorite3) matches.push(true);

      if (filterMode === "and") {
        // ANDモード: 有効な全てのレベルに該当する必要がある
        const enabledCount = [favorite1Enabled, favorite2Enabled, favorite3Enabled].filter(Boolean).length;
        return matches.length === enabledCount && enabledCount > 0;
      } else {
        // ORモード: いずれか1つに該当すればOK
        return matches.length > 0;
      }
    })
    .map((r) => r.questionId);
}

/**
 * セクションのお気に入り問題を取得
 */
export async function getFavoriteQuestionsBySection(
  userId: string,
  sectionId: number,
) {
  const favoriteIds = await getFavoriteQuestionIds(userId);

  if (favoriteIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.sectionId, sectionId),
        sql`${questions.id} IN (${sql.join(
          favoriteIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    )
    .all();
}

/**
 * ユーザーの全ての「間違えた問題」を取得（試験・セクション情報付き）
 * sectionQuestionProgress で isCorrect: false のもの
 */
export async function getAllIncorrectQuestions(userId: string) {
  return db
    .select({
      progress: sectionQuestionProgress,
      question: questions,
      section: sections,
      exam: exams,
      record: userQuestionRecords, // Add record
    })
    .from(sectionQuestionProgress)
    .innerJoin(questions, eq(sectionQuestionProgress.questionId, questions.id))
    .innerJoin(sections, eq(questions.sectionId, sections.id))
    .leftJoin(exams, eq(sections.examId, exams.id))
    .leftJoin(
      userQuestionRecords,
      and(
        eq(userQuestionRecords.userId, userId),
        eq(userQuestionRecords.questionId, questions.id),
      ),
    )
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.isCorrect, false),
      ),
    )
    .orderBy(desc(sectionQuestionProgress.updatedAt))
    .all();
}

/**
 * ユーザーの全ての「お気に入り問題」を取得（試験・セクション情報付き）
 * userQuestionRecords で isFavorite: true のもの
 * 設定に基づいてフィルタリング
 */
export async function getAllFavoriteQuestions(userId: string) {
  // 設定を取得
  const settings = await getFavoriteSettings(userId);
  
  // デフォルト設定
  const favorite1Enabled = settings?.favorite1Enabled ?? true;
  const favorite2Enabled = settings?.favorite2Enabled ?? true;
  const favorite3Enabled = settings?.favorite3Enabled ?? true;
  const filterMode = settings?.filterMode ?? "or";

  // 有効なお気に入りレベルの条件を構築
  const favoriteConditions = [];
  if (favorite1Enabled) {
    favoriteConditions.push(eq(userQuestionRecords.isFavorite1, true));
  }
  if (favorite2Enabled) {
    favoriteConditions.push(eq(userQuestionRecords.isFavorite2, true));
  }
  if (favorite3Enabled) {
    favoriteConditions.push(eq(userQuestionRecords.isFavorite3, true));
  }

  // 条件が1つもない場合は空配列を返す
  if (favoriteConditions.length === 0) {
    return [];
  }

  // OR または AND で条件を結合
  const favoriteFilter =
    filterMode === "and" && favoriteConditions.length > 1
      ? and(...favoriteConditions)
      : or(...favoriteConditions);

  return db
    .select({
      record: userQuestionRecords,
      question: questions,
      section: sections,
      exam: exams,
    })
    .from(userQuestionRecords)
    .innerJoin(questions, eq(userQuestionRecords.questionId, questions.id))
    .innerJoin(sections, eq(questions.sectionId, sections.id))
    .leftJoin(exams, eq(sections.examId, exams.id))
    .where(and(eq(userQuestionRecords.userId, userId), favoriteFilter))
    .orderBy(desc(userQuestionRecords.updatedAt))
    .all();
}

// ==================== お気に入り設定関連 ====================

/**
 * お気に入り設定を取得
 */
export async function getFavoriteSettings(userId: string) {
  return db
    .select()
    .from(favoriteSettings)
    .where(eq(favoriteSettings.userId, userId))
    .get();
}

/**
 * お気に入り設定を保存
 */
export async function upsertFavoriteSettings(
  userId: string,
  favorite1Enabled: boolean,
  favorite2Enabled: boolean,
  favorite3Enabled: boolean,
  filterMode: "or" | "and",
) {
  return db
    .insert(favoriteSettings)
    .values({
      userId,
      favorite1Enabled,
      favorite2Enabled,
      favorite3Enabled,
      filterMode,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [favoriteSettings.userId],
      set: {
        favorite1Enabled,
        favorite2Enabled,
        favorite3Enabled,
        filterMode,
        updatedAt: new Date(),
      },
    })
    .returning()
    .get();
}
