import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getIncorrectQuestionsByExam } from "@/backend/db/queries";

/**
 * 学習履歴用API
 * GET /api/exams/[id]/incorrect-questions
 * 
 * 指定された試験の間違えた問題をセクションごとに取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const examId = parseInt(id, 10);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // セクションごとの間違えた問題を取得
    const result = await getIncorrectQuestionsByExam(userId, examId);

    return NextResponse.json({ sections: result });
  } catch (error) {
    console.error("Error fetching incorrect questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
