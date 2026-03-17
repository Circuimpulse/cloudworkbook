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
    const { questionText, userAnswer, correctAnswer, explanation: correctAnswerDetail } = parsed.data;

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
      ? `\n【模範解答の詳細】\n${typeof correctAnswerDetail === "string" ? correctAnswerDetail : JSON.stringify(correctAnswerDetail, null, 2)}`
      : "";

    const prompt = `あなたはFP（ファイナンシャルプランナー）試験の採点官です。
以下の問題に対するユーザーの回答を採点してください。

【問題文】
${questionText}

【模範解答】
${correctAnswer}${detailStr}

【ユーザーの回答】
${userAnswer}

## 採点基準
- 数値回答の場合：単位の有無は問わないが、数値が正確に一致しているか確認
- 語群選択の場合：各空欄の選択が正しいか確認
- ○×判定の場合：各項目の○×が一致しているか確認
- 計算問題の場合：計算過程が正しく、最終値が一致しているか確認
- 部分点も考慮（一部正解の場合はscoreに反映）

## 出力形式
以下のJSON形式で回答してください。他の文字は含めないこと：
{
  "score": 0から100の整数（100=完全正解、0=完全不正解、部分点あり）,
  "isCorrect": boolean（score >= 80 ならtrue）,
  "explanation": "採点理由の解説を日本語で丁寧に記述。ユーザーの回答がどこが正しくどこが間違っているか、模範解答との比較を含める。"
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
