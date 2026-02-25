import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSetFavorite } from "@/backend/db/queries";

/**
 * お気に入り一括登録API
 * POST /api/questions/bulk-favorite
 *
 * Body: {
 *   questionIds: number[],
 *   levels: number[]  // [1], [1,3], [1,2,3] など
 * }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionIds, levels } = body;

    if (
      !Array.isArray(questionIds) ||
      questionIds.length === 0 ||
      !Array.isArray(levels) ||
      levels.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request body. questionIds and levels are required." },
        { status: 400 },
      );
    }

    // レベルのバリデーション（1,2,3のみ許可）
    const validLevels = levels.filter((l: number) => l >= 1 && l <= 3);
    if (validLevels.length === 0) {
      return NextResponse.json(
        { error: "Invalid levels. Must be 1, 2, or 3." },
        { status: 400 },
      );
    }

    const results = await bulkSetFavorite(userId, questionIds, validLevels);

    return NextResponse.json({
      success: true,
      count: results.length,
      levels: validLevels,
    });
  } catch (error) {
    console.error("Error bulk setting favorites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
