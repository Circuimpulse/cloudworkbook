import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAllSections } from "@/lib/db/queries";

// Edge Runtimeを使用（Cloudflare移行を見据えて）
export const runtime = "edge";

/**
 * セクション一覧取得API
 * GET /api/sections
 */
export async function GET() {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セクション一覧取得
    const sections = await getAllSections();

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
