import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRandomQuestions } from "@/backend/db/queries";

// Node.js Runtimeを使用（ローカルSQLiteファイルアクセスのため）
// export const runtime = "edge"; // Cloudflare移行時に有効化

/**
 * ランダム問題取得API
 * GET /api/mock-test/random?limit=50
 *
 * SQLite互換のRANDOM()を使用しているため、D1でもそのまま動作
 */
export async function GET(request: Request) {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // クエリパラメータから問題数を取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const examIdParam = searchParams.get("examId");
    const examId = examIdParam ? parseInt(examIdParam, 10) : undefined;

    // ランダム問題取得
    const questions = await getRandomQuestions(limit, examId);

    // 正解を隠して返す（クライアント側で答え合わせ時に再取得）
    const questionsWithoutAnswer = questions.map((q) => ({
      id: q.id,
      sectionId: q.sectionId,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      // correctAnswerとexplanationは含めない
    }));

    return NextResponse.json({ questions: questionsWithoutAnswer });
  } catch (error) {
    console.error("Error fetching random questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
