import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getFavoriteSettings,
  upsertFavoriteSettings,
} from "@/backend/db/queries";

/**
 * お気に入り設定API
 * GET /api/settings/favorite - 設定を取得
 * POST /api/settings/favorite - 設定を保存
 */

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getFavoriteSettings(userId);

    // デフォルト設定
    const defaultSettings = {
      favorite1Enabled: true,
      favorite2Enabled: true,
      favorite3Enabled: true,
      filterMode: "or" as const,
    };

    return NextResponse.json(settings || defaultSettings);
  } catch (error) {
    console.error("Error fetching favorite settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { favorite1Enabled, favorite2Enabled, favorite3Enabled, filterMode } =
      body;

    // バリデーション
    if (
      typeof favorite1Enabled !== "boolean" ||
      typeof favorite2Enabled !== "boolean" ||
      typeof favorite3Enabled !== "boolean" ||
      (filterMode !== "or" && filterMode !== "and")
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const settings = await upsertFavoriteSettings(
      userId,
      favorite1Enabled,
      favorite2Enabled,
      favorite3Enabled,
      filterMode,
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error saving favorite settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

