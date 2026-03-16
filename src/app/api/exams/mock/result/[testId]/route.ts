import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMockTestDetails } from "@/backend/db/queries";
import { db } from "@/backend/db/client";
import { mockTestHistory } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * 模擬テスト結果取得API
 * GET /api/exams/mock/result/[testId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId } = await params;
    const testIdNum = parseInt(testId, 10);

    if (isNaN(testIdNum)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    // テスト履歴を取得（本人のもののみ）
    const testHistory = await db
      .select()
      .from(mockTestHistory)
      .where(
        and(
          eq(mockTestHistory.id, testIdNum),
          eq(mockTestHistory.userId, userId),
        ),
      )
      .get();

    if (!testHistory) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // テスト詳細を取得
    const details = await getMockTestDetails(testIdNum);

    return NextResponse.json({
      testId: testHistory.id,
      score: testHistory.score,
      totalQuestions: testHistory.totalQuestions,
      examId: testHistory.examId,
      takenAt: testHistory.takenAt,
      details: details.map((d) => ({
        questionId: d.questionId,
        userAnswer: d.userAnswer,
        isCorrect: d.isCorrect,
        correctAnswer: d.question?.correctAnswer,
        question: d.question,
      })),
    });
  } catch (error) {
    console.error("Error fetching test result:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
