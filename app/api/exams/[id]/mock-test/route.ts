import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRandomQuestions } from "@/backend/db/queries";

/**
 * 本試験モード用API
 * GET /api/exams/[id]/mock-test
 * 
 * 指定された試験からランダムに50問を取得
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

    // ランダムに50問取得
    const questions = await getRandomQuestions(50, examId);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching mock test questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
