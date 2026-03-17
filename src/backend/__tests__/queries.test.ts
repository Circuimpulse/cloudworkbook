import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

// インメモリDBでテスト
const client = createClient({ url: ":memory:" });
const testDb = drizzle(client, { schema });

// テーブル作成
async function setupDatabase() {
  await client.execute(`CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    email text NOT NULL,
    name text,
    created_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer DEFAULT (unixepoch()) NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS exams (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    title text NOT NULL,
    description text,
    slug text,
    question_format text DEFAULT 'choice_only'
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS sections (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    exam_id integer REFERENCES exams(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    "order" integer NOT NULL,
    created_at integer DEFAULT (unixepoch()) NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS questions (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    section_id integer NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL DEFAULT 'choice',
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text,
    option_d text,
    correct_answer text NOT NULL,
    correct_answer_detail text,
    explanation text,
    "order" integer NOT NULL,
    category_id integer,
    exam_year_id integer,
    question_number integer,
    image_url text,
    has_image integer DEFAULT 0 NOT NULL,
    source_note text,
    created_at integer DEFAULT (unixepoch()) NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS user_question_records (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id integer NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    is_correct integer,
    is_favorite integer DEFAULT 0,
    is_favorite_1 integer DEFAULT 0,
    is_favorite_2 integer DEFAULT 0,
    is_favorite_3 integer DEFAULT 0,
    updated_at integer DEFAULT (unixepoch()) NOT NULL,
    PRIMARY KEY (user_id, question_id)
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS section_progress (
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    section_id integer NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    correct_count integer DEFAULT 0 NOT NULL,
    total_count integer DEFAULT 0 NOT NULL,
    last_studied_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer DEFAULT (unixepoch()) NOT NULL,
    PRIMARY KEY (user_id, section_id)
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS section_question_progress (
    user_id text NOT NULL,
    section_id integer NOT NULL,
    question_id integer NOT NULL,
    user_answer text DEFAULT '' NOT NULL,
    is_correct integer NOT NULL,
    updated_at integer DEFAULT (unixepoch()) NOT NULL,
    PRIMARY KEY (user_id, section_id, question_id)
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS favorite_settings (
    user_id text PRIMARY KEY NOT NULL,
    favorite1_enabled integer NOT NULL DEFAULT 1,
    favorite2_enabled integer NOT NULL DEFAULT 1,
    favorite3_enabled integer NOT NULL DEFAULT 1,
    filter_mode text NOT NULL DEFAULT 'or',
    updated_at integer DEFAULT (unixepoch()) NOT NULL
  )`);
}

// シードデータ
async function seedTestData() {
  // Clear (FK制約に注意して逆順で削除)
  await client.execute("PRAGMA foreign_keys = OFF");
  await client.execute("DELETE FROM favorite_settings");
  await client.execute("DELETE FROM user_question_records");
  await client.execute("DELETE FROM section_question_progress");
  await client.execute("DELETE FROM section_progress");
  await client.execute("DELETE FROM questions");
  await client.execute("DELETE FROM sections");
  await client.execute("DELETE FROM exams");
  await client.execute("DELETE FROM users");
  // AUTOINCREMENTリセット
  await client.execute("DELETE FROM sqlite_sequence");
  await client.execute("PRAGMA foreign_keys = ON");

  // Users
  await testDb.insert(schema.users).values({ id: "user1", email: "test@test.com", name: "Test" });

  // Exams
  await testDb.insert(schema.exams).values({ title: "FP2級 学科", slug: "fp2-gakka" });

  // Sections
  await testDb.insert(schema.sections).values([
    { examId: 1, title: "#1", order: 1, description: "問1〜5" },
    { examId: 1, title: "#2", order: 2, description: "問6〜10" },
  ]);

  // Questions (5 per section)
  for (let s = 1; s <= 2; s++) {
    for (let q = 1; q <= 5; q++) {
      await testDb.insert(schema.questions).values({
        sectionId: s,
        questionText: `Section ${s} Question ${q}`,
        optionA: "A", optionB: "B", optionC: "C", optionD: "D",
        correctAnswer: "A",
        order: q,
        questionNumber: (s - 1) * 5 + q,
        hasImage: false,
      });
    }
  }
}

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await seedTestData();
});

describe("Exam queries", () => {
  it("getAllExams returns exams", async () => {
    const exams = await testDb.select().from(schema.exams).all();
    expect(exams).toHaveLength(1);
    expect(exams[0].title).toBe("FP2級 学科");
  });

  it("getSectionsByExamId returns sections", async () => {
    const sections = await testDb.select().from(schema.sections)
      .where(eq(schema.sections.examId, 1)).all();
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("#1");
  });
});

describe("Question queries", () => {
  it("getQuestionsBySection returns 5 questions", async () => {
    const qs = await testDb.select().from(schema.questions)
      .where(eq(schema.questions.sectionId, 1)).all();
    expect(qs).toHaveLength(5);
  });

  it("questions reference correct section", async () => {
    const qs = await testDb.select().from(schema.questions)
      .where(eq(schema.questions.sectionId, 2)).all();
    expect(qs).toHaveLength(5);
    expect(qs[0].questionText).toContain("Section 2");
  });
});

describe("User question records", () => {
  it("insert and retrieve answer record", async () => {
    await testDb.insert(schema.userQuestionRecords).values({
      userId: "user1",
      questionId: 1,
      isCorrect: true,
    });

    const records = await testDb.select().from(schema.userQuestionRecords)
      .where(eq(schema.userQuestionRecords.userId, "user1")).all();
    expect(records).toHaveLength(1);
    expect(records[0].isCorrect).toBe(true);
  });

  it("favorite flags default to false", async () => {
    await testDb.insert(schema.userQuestionRecords).values({
      userId: "user1",
      questionId: 1,
      isCorrect: false,
    });

    const [record] = await testDb.select().from(schema.userQuestionRecords)
      .where(eq(schema.userQuestionRecords.userId, "user1")).all();
    expect(record.isFavorite1).toBe(false);
    expect(record.isFavorite2).toBe(false);
    expect(record.isFavorite3).toBe(false);
  });

  it("bulk insert multiple records", async () => {
    await testDb.insert(schema.userQuestionRecords).values([
      { userId: "user1", questionId: 1, isCorrect: true },
      { userId: "user1", questionId: 2, isCorrect: false },
      { userId: "user1", questionId: 3, isCorrect: true },
    ]);

    const records = await testDb.select().from(schema.userQuestionRecords)
      .where(eq(schema.userQuestionRecords.userId, "user1")).all();
    expect(records).toHaveLength(3);
  });
});

describe("Incorrect questions (N+1 fixed pattern)", () => {
  it("finds incorrect questions across sections in one query", async () => {
    // Insert answers: Q1 correct, Q2 incorrect, Q6 incorrect
    await testDb.insert(schema.userQuestionRecords).values([
      { userId: "user1", questionId: 1, isCorrect: true },
      { userId: "user1", questionId: 2, isCorrect: false },
      { userId: "user1", questionId: 6, isCorrect: false },
    ]);

    // Single query for all sections (the N+1 fix pattern)
    const sectionIds = [1, 2];
    const incorrectRecords = await testDb.select()
      .from(schema.userQuestionRecords)
      .innerJoin(schema.questions, eq(schema.userQuestionRecords.questionId, schema.questions.id))
      .where(
        and(
          eq(schema.userQuestionRecords.userId, "user1"),
          eq(schema.userQuestionRecords.isCorrect, false),
          sql`${schema.questions.sectionId} IN (${sql.join(sectionIds.map((id) => sql`${id}`), sql`, `)})`,
        ),
      ).all();

    expect(incorrectRecords).toHaveLength(2);
    expect(incorrectRecords.map(r => r.questions.id).sort()).toEqual([2, 6]);
  });
});

describe("Favorite filtering (SQL-based)", () => {
  it("filters favorites with OR mode", async () => {
    await testDb.insert(schema.userQuestionRecords).values([
      { userId: "user1", questionId: 1, isCorrect: true, isFavorite1: true },
      { userId: "user1", questionId: 2, isCorrect: false, isFavorite2: true },
      { userId: "user1", questionId: 3, isCorrect: true },
    ]);

    // OR: fav1 OR fav2
    const conditions = [
      sql`${schema.userQuestionRecords.isFavorite1} = 1`,
      sql`${schema.userQuestionRecords.isFavorite2} = 1`,
    ];
    const favoriteCondition = sql.join(conditions, sql` OR `);

    const records = await testDb.select({ questionId: schema.userQuestionRecords.questionId })
      .from(schema.userQuestionRecords)
      .where(and(
        eq(schema.userQuestionRecords.userId, "user1"),
        favoriteCondition,
      )).all();

    expect(records).toHaveLength(2);
    expect(records.map(r => r.questionId).sort()).toEqual([1, 2]);
  });

  it("filters favorites with AND mode", async () => {
    await testDb.insert(schema.userQuestionRecords).values([
      { userId: "user1", questionId: 1, isCorrect: true, isFavorite1: true, isFavorite2: true },
      { userId: "user1", questionId: 2, isCorrect: false, isFavorite1: true },
    ]);

    // AND: fav1 AND fav2
    const conditions = [
      sql`${schema.userQuestionRecords.isFavorite1} = 1`,
      sql`${schema.userQuestionRecords.isFavorite2} = 1`,
    ];
    const favoriteCondition = sql.join(conditions, sql` AND `);

    const records = await testDb.select({ questionId: schema.userQuestionRecords.questionId })
      .from(schema.userQuestionRecords)
      .where(and(
        eq(schema.userQuestionRecords.userId, "user1"),
        favoriteCondition,
      )).all();

    expect(records).toHaveLength(1);
    expect(records[0].questionId).toBe(1);
  });
});

describe("Section progress", () => {
  it("insert and update progress", async () => {
    await testDb.insert(schema.sectionProgress).values({
      userId: "user1",
      sectionId: 1,
      correctCount: 3,
      totalCount: 5,
    });

    const [progress] = await testDb.select().from(schema.sectionProgress)
      .where(and(
        eq(schema.sectionProgress.userId, "user1"),
        eq(schema.sectionProgress.sectionId, 1),
      )).all();

    expect(progress.correctCount).toBe(3);
    expect(progress.totalCount).toBe(5);
  });
});

describe("Section with exam join", () => {
  it("returns section with exam data", async () => {
    const result = await testDb.select({
      section: schema.sections,
      exam: schema.exams,
    }).from(schema.sections)
      .leftJoin(schema.exams, eq(schema.sections.examId, schema.exams.id))
      .where(eq(schema.sections.id, 1))
      .get();

    expect(result).not.toBeNull();
    expect(result!.section.title).toBe("#1");
    expect(result!.exam!.title).toBe("FP2級 学科");
  });
});

describe("Cascade delete", () => {
  it("deleting section cascades to questions", async () => {
    const before = await testDb.select().from(schema.questions)
      .where(eq(schema.questions.sectionId, 1)).all();
    expect(before).toHaveLength(5);

    await testDb.delete(schema.sections).where(eq(schema.sections.id, 1));

    const after = await testDb.select().from(schema.questions)
      .where(eq(schema.questions.sectionId, 1)).all();
    expect(after).toHaveLength(0);
  });
});
