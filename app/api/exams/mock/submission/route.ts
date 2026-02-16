import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMockTest, insertMockTestDetails } from "@/backend/db/queries";
import { db } from "@/backend/db/client";
import { questions } from "@/backend/db/schema";
import { inArray } from "drizzle-orm";

// Node.js Runtimeを使用（ローカルSQLiteファイルアクセスのため）
// export const runtime = "edge"; // Cloudflare移行時に有効化

/**
 * 模擬テスト提出API
 * POST /api/mock-test/submit
 *
 * Body: {
 *   answers: Array<{ questionId: number, userAnswer: string }>
 * }
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディ取得
    const body = await request.json();
    const { answers } = body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // 問題IDリストを取得
    const questionIds = answers.map((a) => a.questionId);

    // 正解を取得
    const correctAnswers = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds))
      .all();

    // 正解マップを作成
    const correctAnswerMap = new Map(
      correctAnswers.map((q) => [q.id, q.correctAnswer]),
    );

    // 採点
    let score = 0;
    const details = answers.map((answer) => {
      const correctAnswer = correctAnswerMap.get(answer.questionId);
      const isCorrect = answer.userAnswer === correctAnswer;
      if (isCorrect) score++;

      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
      };
    });

    // テスト履歴を保存
    const mockTest = await createMockTest(userId, score, answers.length);

    // テスト詳細を保存
    await insertMockTestDetails(mockTest.id, details);

    return NextResponse.json({
      testId: mockTest.id,
      score,
      totalQuestions: answers.length,
      details: details.map((d, index) => ({
        ...d,
        correctAnswer: correctAnswerMap.get(d.questionId),
        question: correctAnswers.find((q) => q.id === d.questionId),
      })),
    });
  } catch (error) {
    console.error("Error submitting mock test:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
