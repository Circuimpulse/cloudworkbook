import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upsertSectionProgress } from "@/backend/db/queries";

// Node.js Runtimeを使用（ローカルSQLiteファイルアクセスのため）
// Cloudflare移行時にEdge Runtimeに変更予定

/**
 * セクション進捗保存API
 * POST /api/sections/progress
 *
 * Body: {
 *   sectionId: number,
 *   correctCount: number,
 *   totalCount: number
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
    const { sectionId, correctCount, totalCount } = body;

    // バリデーション
    if (
      typeof sectionId !== "number" ||
      typeof correctCount !== "number" ||
      typeof totalCount !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (correctCount < 0 || totalCount < 0 || correctCount > totalCount) {
      return NextResponse.json({ error: "Invalid counts" }, { status: 400 });
    }

    // 進捗を保存（上書き）
    const progress = await upsertSectionProgress(
      userId,
      sectionId,
      correctCount,
      totalCount,
    );

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error saving section progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
