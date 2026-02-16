import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  upsertSectionQuestionProgress,
  getUserById,
  createUser,
  upsertUserQuestionRecord,
} from "@/backend/db/queries";

// Node.js Runtimeを使用（ローカルSQLiteファイルアクセスのため）
// Cloudflare移行時にEdge Runtimeに変更予定

/**
 * セクション問題別進捗保存API
 * POST /api/sections/questions/progress
 *
 * Body: {
 *   sectionId: number,
 *   questionId: number,
 *   isCorrect: boolean
 * }
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // ユーザーが存在するか確認、なければ作成（FK制約回避のため）
    let dbUser = await getUserById(userId);
    if (!dbUser) {
      const email = user.emailAddresses[0]?.emailAddress || "";
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      // createUser は Promise<{...}[]> を返すので await する
      await createUser(userId, email, name);
    }

    // リクエストボディ取得
    const body = await request.json();
    const { sectionId, questionId, userAnswer, isCorrect } = body;

    // バリデーション
    if (
      typeof sectionId !== "number" ||
      typeof questionId !== "number" ||
      typeof userAnswer !== "string" ||
      typeof isCorrect !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // 進捗を保存（上書き）
    const progress = await upsertSectionQuestionProgress(
      userId,
      sectionId,
      questionId,
      userAnswer,
      isCorrect,
    );

    // 永続履歴を保存（上書き）
    await upsertUserQuestionRecord(userId, questionId, isCorrect);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error saving section question progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
