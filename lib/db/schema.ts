import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * ユーザーテーブル
 * ClerkのuserIdと紐付け
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // ClerkのuserIdをそのまま使用
  email: text("email").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * セクションテーブル
 * 7問1セットの問題グループ
 */
export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(), // 表示順序
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 問題テーブル
 */
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // 'A', 'B', 'C', 'D'
  explanation: text("explanation"), // 解説
  order: integer("order").notNull(), // セクション内での順序
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * セクション進捗テーブル
 * ユーザーごとのセクション学習状況（上書き更新）
 */
export const sectionProgress = sqliteTable(
  "section_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sectionId: integer("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    correctCount: integer("correct_count").notNull().default(0), // 正解数
    totalCount: integer("total_count").notNull().default(0), // 解答数
    lastStudiedAt: integer("last_studied_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.sectionId] }),
  })
);

/**
 * 模擬テスト履歴テーブル
 * 各回のテスト結果を記録（追記型）
 */
export const mockTestHistory = sqliteTable("mock_test_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 50問中の正解数
  totalQuestions: integer("total_questions").notNull().default(50),
  takenAt: integer("taken_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 模擬テスト詳細テーブル
 * 各問題の解答記録
 */
export const mockTestDetails = sqliteTable("mock_test_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: integer("test_id")
    .notNull()
    .references(() => mockTestHistory.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull(), // 'A', 'B', 'C', 'D'
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 型エクスポート
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type SectionProgress = typeof sectionProgress.$inferSelect;
export type NewSectionProgress = typeof sectionProgress.$inferInsert;

export type MockTestHistory = typeof mockTestHistory.$inferSelect;
export type NewMockTestHistory = typeof mockTestHistory.$inferInsert;

export type MockTestDetail = typeof mockTestDetails.$inferSelect;
export type NewMockTestDetail = typeof mockTestDetails.$inferInsert;
