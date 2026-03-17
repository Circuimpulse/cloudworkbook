import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { bulkSetFavorite } from "@/backend/db/queries";
import { bulkFavoriteSchema } from "@/backend/validations";

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
    const parsed = bulkFavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const results = await bulkSetFavorite(userId, parsed.data.questionIds, parsed.data.levels);

    return NextResponse.json({
      success: true,
      count: results.updated + results.inserted,
      levels: parsed.data.levels,
    });
  } catch (error) {
    console.error("Error bulk setting favorites:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
