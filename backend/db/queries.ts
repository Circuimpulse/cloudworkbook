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
} from "./schema";
import { eq, and, sql, desc } from "drizzle-orm";

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
 * ユーザーごとの問題記録（履歴）を保存（上書き）
 */
export async function upsertUserQuestionRecord(
  userId: string,
  questionId: number,
  isCorrect: boolean,
) {
  return db
    .insert(userQuestionRecords)
    .values({
      userId,
      questionId,
      isCorrect,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userQuestionRecords.userId, userQuestionRecords.questionId],
      set: {
        isCorrect,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * セクション進捗のリセット（Homeに戻ったとき用）
 */
export async function resetSectionProgress(userId: string, sectionId: number) {
  return db
    .delete(sectionQuestionProgress)
    .where(
      and(
        eq(sectionQuestionProgress.userId, userId),
        eq(sectionQuestionProgress.sectionId, sectionId),
      ),
    );
}
