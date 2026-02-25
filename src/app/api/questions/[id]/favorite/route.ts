import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toggleFavorite, getFavoriteStatus } from "@/backend/db/queries";

/**
 * お気に入りAPI
 * GET /api/questions/[id]/favorite - お気に入り状態を取得
 * POST /api/questions/[id]/favorite - お気に入り状態をトグル
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 },
      );
    }

    const status = await getFavoriteStatus(userId, questionId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching favorite status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 },
      );
    }

    // リクエストボディからlevelを取得（デフォルトは1）
    const body = await request.json().catch(() => ({}));
    const level = body.level ? parseInt(body.level, 10) : 1;

    const result = await toggleFavorite(userId, questionId, level);
    const updatedRecord = result[0];

    return NextResponse.json({
      isFavorite: updatedRecord?.isFavorite || false,
      isFavorite1: updatedRecord?.isFavorite1 || false,
      isFavorite2: updatedRecord?.isFavorite2 || false,
      isFavorite3: updatedRecord?.isFavorite3 || false,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
