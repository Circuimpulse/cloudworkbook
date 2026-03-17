import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrivateMetadata } from "@/backend/types";

/**
 * APIキー設定APIルート
 * Clerk privateMetadata にGemini APIキーを安全に保存・取得
 */

// GET: 保存済みAPIキーの有無を確認（キー自体は返さない）
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const hasApiKey = !!getPrivateMetadata(user.privateMetadata)?.geminiApiKey;

    return NextResponse.json({
      hasApiKey,
      // セキュリティ上、キーの値そのものは返さない
      maskedKey: hasApiKey
        ? maskApiKey(getPrivateMetadata(user.privateMetadata).geminiApiKey ?? "")
        : null,
    });
  } catch (error: unknown) {
    console.error("API key GET error:", error);
    return NextResponse.json(
      { error: "APIキーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: APIキーを保存
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    const client = await clerkClient();

    if (!apiKey || !apiKey.trim()) {
      // キーを削除
      const user = await client.users.getUser(userId);
      const currentMetadata = getPrivateMetadata(user.privateMetadata) || {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { geminiApiKey, ...rest } = currentMetadata;

      await client.users.updateUser(userId, {
        privateMetadata: rest,
      });

      return NextResponse.json({ success: true, hasApiKey: false });
    }

    // キーを保存
    const user = await client.users.getUser(userId);
    const currentMetadata = getPrivateMetadata(user.privateMetadata) || {};

    await client.users.updateUser(userId, {
      privateMetadata: {
        ...currentMetadata,
        geminiApiKey: apiKey.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      maskedKey: maskApiKey(apiKey.trim()),
    });
  } catch (error: unknown) {
    console.error("API key POST error:", error);
    return NextResponse.json(
      { error: "APIキーの保存に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: APIキーを削除
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = getPrivateMetadata(user.privateMetadata) || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geminiApiKey, ...rest } = currentMetadata;

    await client.users.updateUser(userId, {
      privateMetadata: rest,
    });

    return NextResponse.json({ success: true, hasApiKey: false });
  } catch (error: unknown) {
    console.error("API key DELETE error:", error);
    return NextResponse.json(
      { error: "APIキーの削除に失敗しました" },
      { status: 500 }
    );
  }
}

// APIキーをマスクする（先頭4文字と末尾4文字以外を隠す）
function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}
