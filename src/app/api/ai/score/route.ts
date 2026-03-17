import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiScoreSchema } from "@/backend/validations";
import { getPrivateMetadata } from "@/backend/types";

/**
 * AI採点APIルート
 * Clerk privateMetadata からAPIキーを取得し、Gemini APIで記述式回答を採点
 * → クライアントからAPIキーを送る必要なし（セキュア）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = aiScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "問題文、ユーザー回答、正解のいずれかが不足しています", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    // XSS/インジェクション対策: HTMLタグとスクリプト参照を除去
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "");
    const questionText = sanitize(parsed.data.questionText);
    const userAnswer = sanitize(parsed.data.userAnswer);
    const correctAnswer = sanitize(parsed.data.correctAnswer);
    const correctAnswerDetail = parsed.data.explanation ? sanitize(parsed.data.explanation) : undefined;
    const examType = parsed.data.examType;

    // Clerk privateMetadata からAPIキーを取得
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const apiKey = getPrivateMetadata(user.privateMetadata)?.geminiApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーが設定されていません。設定画面でAPIキーを登録してください。" },
        { status: 400 }
      );
    }

    // Gemini APIクライアント作成
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    // 採点プロンプト構築
    const detailStr = correctAnswerDetail
      ? `\n【模範解答の詳細・解説】\n${typeof correctAnswerDetail === "string" ? correctAnswerDetail : JSON.stringify(correctAnswerDetail, null, 2)}`
      : "";

    // 問題文中の図表説明を抽出（![alt](url) パターン）
    const imageDescriptions = [...questionText.matchAll(/!\[([^\]]+)\]\([^)]+\)/g)]
      .map((m) => m[1])
      .filter((alt) => alt && alt !== "");
    const figureContext = imageDescriptions.length > 0
      ? `\n【問題に含まれる図表】\n${imageDescriptions.map((d, i) => `- 図${i + 1}: ${d}`).join("\n")}\n※図表の内容は上記の説明テキストを基に判断してください。`
      : "";

    // 試験種別に応じた採点官の役割設定
    const isIpaGogo = examType && !examType.startsWith("fp");
    const roleDescription = isIpaGogo
      ? "あなたはIPA情報処理技術者試験の午後問題の採点官です。記述式問題を厳密かつ公正に採点してください。"
      : "あなたは資格試験の採点官です。以下の問題に対するユーザーの回答を採点してください。";

    const prompt = `${roleDescription}

【問題文】
${questionText}

【模範解答】
${correctAnswer}${detailStr}${figureContext}

【ユーザーの回答】
${userAnswer}

## 採点方法
以下の観点で採点してください：

### 記述式問題の場合
1. **キーワード採点**: 模範解答に含まれる重要なキーワード・専門用語がユーザーの回答に含まれているか
2. **本質の一致**: 模範解答と表現が異なっていても、言っていることの本質が同じであれば正解として扱う
3. **部分点**: 一部のキーワードが含まれている、方向性は合っているが不十分な場合は部分点を付与
4. **字数制限**: 問題文に字数制限がある場合、大幅に超過していれば減点

### 選択・計算問題の場合
- 数値回答：単位の有無は問わないが数値が正確に一致しているか
- 語群選択：各空欄の選択が正しいか
- ○×判定：各項目の○×が一致しているか

## 出力形式（JSON）
{
  "score": 0から100の整数（100=完全正解、0=完全不正解、部分点あり）,
  "isCorrect": true（score>=80）またはfalse,
  "explanation": "採点理由を日本語で解説。以下を含めること：\\n・ユーザーの回答の良い点\\n・不足しているキーワードや要素\\n・模範解答との具体的な比較\\n・改善のためのアドバイス"
}`;

    // Gemini API呼び出し
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // JSONパース
    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch {
      // JSONパースに失敗した場合、テキストから抽出を試みる
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          {
            error: "AI応答のパースに失敗しました",
            rawResponse: responseText,
          },
          { status: 500 }
        );
      }
    }

    // レスポンスの正規化
    const response = {
      score: Math.max(0, Math.min(100, Number(aiResult.score) || 0)),
      isCorrect: Boolean(aiResult.isCorrect),
      explanation: String(aiResult.explanation || "採点結果を取得できませんでした"),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("AI scoring error:", error);

    // Gemini API固有のエラーハンドリング
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = (error as { status?: number }).status;
    if (errMsg.includes("API_KEY_INVALID") || errStatus === 400) {
      return NextResponse.json(
        { error: "APIキーが無効です。正しいGemini APIキーを設定してください。" },
        { status: 401 }
      );
    }

    if (errMsg.includes("QUOTA") || errStatus === 429) {
      return NextResponse.json(
        { error: "APIの利用上限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `AI採点でエラーが発生しました: ${errMsg || "不明なエラー"}` },
      { status: 500 }
    );
  }
}
