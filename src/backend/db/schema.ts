import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  unique,
} from "drizzle-orm/sqlite-core";
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
 * IPAカテゴリテーブル
 * IPA公式の3階層分類（大分類→中分類→小分類）
 * 例: "テクノロジ系" → "基礎理論" → "離散数学"
 */
export const ipaCategories = sqliteTable("ipa_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: integer("parent_id").references((): any => ipaCategories.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  level: integer("level").notNull(), // 1=大分類, 2=中分類, 3=小分類
});

/**
 * 試験区分テーブル
 * 例: "応用情報試験：午前", "Fp3級"
 */
export const exams = sqliteTable("exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").unique(), // URL用 (optional)
  questionFormat: text("question_format", {
    enum: ["choice_only", "mixed"],
  }).default("choice_only"), // choice_only=4択のみ, mixed=混合形式
});

/**
 * 試験年度テーブル
 * 過去問の年度・回（春期/秋期）を管理
 */
export const examYears = sqliteTable(
  "exam_years",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    year: integer("year").notNull(), // 例: 2024
    season: text("season", { enum: ["spring", "autumn", "jan", "may", "sep"] }).notNull(),
    label: text("label").notNull(), // 例: "令和6年度 秋期"
  },
  (table) => ({
    uniqYearSeason: unique().on(table.examId, table.year, table.season),
  }),
);

/**
 * 学習セクションテーブル
 * 試験区分ごとの章立て (例: "セクション1", "セクション2")
 */
export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examId: integer("exam_id").references(() => exams.id, {
    onDelete: "cascade",
  }), // 試験区分への紐付け
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(), // 表示順
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 問題テーブル
 * optionC/optionD はNULL許容（2択・3択問題に対応）
 */
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  // 問題形式
  questionType: text("question_type", {
    enum: ["choice", "true_false", "fill_in", "select", "descriptive"],
  })
    .notNull()
    .default("choice"),
  // 4択選択肢（choice, true_false で使用）
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c"), // NULL = 2択問題
  optionD: text("option_d"), // NULL = 2択・3択問題
  correctAnswer: text("correct_answer").notNull(), // 4択:'A'〜'D', ○×:'○'/'×', 記述:正解値
  // 記述式・語群選択の詳細正解データ（JSON）
  correctAnswerDetail: text("correct_answer_detail"), // 例: {"ア":"○","イ":"×","ウ":"○"}
  explanation: text("explanation"),
  order: integer("order").notNull(),
  // 過去問メタデータ
  categoryId: integer("category_id").references(() => ipaCategories.id, {
    onDelete: "set null",
  }),
  examYearId: integer("exam_year_id").references(() => examYears.id, {
    onDelete: "set null",
  }),
  questionNumber: integer("question_number"), // 問1〜問80等
  imageUrl: text("image_url"), // 図表を含む問題の画像パス
  hasImage: integer("has_image", { mode: "boolean" }).notNull().default(false),
  sourceNote: text("source_note"), // 出典メモ 例: "R6秋 問12"
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * セクション進捗テーブル
 * ユーザーごとのセクション学習状況（集計データ）
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
  }),
);

/**
 * セクション問題別進捗テーブル（新規追加）
 * 個別の問題の正誤状況を管理
 */
export const sectionQuestionProgress = sqliteTable(
  "section_question_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sectionId: integer("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    userAnswer: text("user_answer").notNull().default(""), // 追加: ユーザーの回答
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.sectionId, table.questionId],
    }),
  }),
);

/**
 * ユーザーごとの問題記録（永続的な履歴）
 * 間違えた問題やお気に入りなどを記録
 */
export const userQuestionRecords = sqliteTable(
  "user_question_records",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    isCorrect: integer("is_correct", { mode: "boolean" }),
    isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
    isFavorite1: integer("is_favorite_1", { mode: "boolean" }).default(false),
    isFavorite2: integer("is_favorite_2", { mode: "boolean" }).default(false),
    isFavorite3: integer("is_favorite_3", { mode: "boolean" }).default(false),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.questionId] }),
  }),
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
  examId: integer("exam_id").references(() => exams.id, {
    onDelete: "set null",
  }),
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

export type IpaCategory = typeof ipaCategories.$inferSelect;
export type NewIpaCategory = typeof ipaCategories.$inferInsert;

export type ExamYear = typeof examYears.$inferSelect;
export type NewExamYear = typeof examYears.$inferInsert;

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type SectionProgress = typeof sectionProgress.$inferSelect;
export type NewSectionProgress = typeof sectionProgress.$inferInsert;

export type SectionQuestionProgress =
  typeof sectionQuestionProgress.$inferSelect;
export type NewSectionQuestionProgress =
  typeof sectionQuestionProgress.$inferInsert;

export type MockTestHistory = typeof mockTestHistory.$inferSelect;
export type NewMockTestHistory = typeof mockTestHistory.$inferInsert;

export type MockTestDetail = typeof mockTestDetails.$inferSelect;
export type NewMockTestDetail = typeof mockTestDetails.$inferInsert;

/**
 * お気に入り設定テーブル
 * ユーザーごとのお気に入りフィルター設定
 */
export const favoriteSettings = sqliteTable("favorite_settings", {
  userId: text("user_id")
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  favorite1Enabled: integer("favorite1_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  favorite2Enabled: integer("favorite2_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  favorite3Enabled: integer("favorite3_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  filterMode: text("filter_mode", { enum: ["or", "and"] })
    .notNull()
    .default("or"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type FavoriteSettings = typeof favoriteSettings.$inferSelect;
export type NewFavoriteSettings = typeof favoriteSettings.$inferInsert;
