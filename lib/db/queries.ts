import { db } from "./client";
import { questions, sections, sectionProgress, mockTestHistory, mockTestDetails, users } from "./schema";
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

// ==================== セクション関連 ====================

export async function getAllSections() {
  return db.select().from(sections).orderBy(sections.order).all();
}

export async function getSectionById(sectionId: number) {
  return db.select().from(sections).where(eq(sections.id, sectionId)).get();
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
        eq(sectionProgress.sectionId, sectionId)
      )
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
  totalCount: number
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
export async function getRandomQuestions(limit: number = 50) {
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
export async function createMockTest(userId: string, score: number, totalQuestions: number = 50) {
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
  }>
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
      }))
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

export async function createSection(title: string, description: string, order: number) {
  return db
    .insert(sections)
    .values({ title, description, order })
    .returning();
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
  order: number
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
