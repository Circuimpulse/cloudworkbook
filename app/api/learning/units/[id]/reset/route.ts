import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resetSectionProgress, resetIncorrectQuestionsOnly } from "@/backend/db/queries";

/**
 * セクション進捗のリセットAPI
 * POST /api/learning/units/[id]/reset
 * 
 * Query Parameter:
 * - incorrectOnly=true: 間違った問題のみリセット
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const sectionId = parseInt(id, 10);

    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // URLパラメータをチェック
    const url = new URL(request.url);
    const incorrectOnly = url.searchParams.get("incorrectOnly") === "true";

    console.log(`[Reset API] userId: ${userId}, sectionId: ${sectionId}, incorrectOnly: ${incorrectOnly}`);

    if (incorrectOnly) {
      // 間違った問題のみリセット
      const result = await resetIncorrectQuestionsOnly(userId, sectionId);
      console.log(`[Reset API] Incorrect only reset result:`, result);
    } else {
      // 全ての進捗をリセット
      const result = await resetSectionProgress(userId, sectionId);
      console.log(`[Reset API] Full reset result:`, result);
    }

    console.log(`[Reset API] Reset completed successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting section progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
