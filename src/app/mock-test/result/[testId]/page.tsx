import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMockTestDetails } from "@/backend/db/queries";
import { db } from "@/backend/db/client";
import { mockTestHistory } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import MockTestResultScreen from "@/frontend/screens/MockTestResultScreen";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { testId } = await params;
  const testIdNum = parseInt(testId, 10);

  if (isNaN(testIdNum)) {
    redirect("/history");
  }

  // テスト履歴を取得（本人のもののみ）
  const testHistoryRecord = await db
    .select()
    .from(mockTestHistory)
    .where(
      and(
        eq(mockTestHistory.id, testIdNum),
        eq(mockTestHistory.userId, userId),
      ),
    )
    .get();

  if (!testHistoryRecord) {
    redirect("/history");
  }

  // テスト詳細を取得
  const details = await getMockTestDetails(testIdNum);

  const result = {
    testId: testHistoryRecord.id,
    score: testHistoryRecord.score,
    totalQuestions: testHistoryRecord.totalQuestions,
    examId: testHistoryRecord.examId ?? undefined,
    takenAt: testHistoryRecord.takenAt
      ? new Date(testHistoryRecord.takenAt).toISOString()
      : undefined,
    details: details.map((d) => ({
      questionId: d.questionId,
      userAnswer: d.userAnswer ?? "",
      isCorrect: d.isCorrect ?? false,
      correctAnswer: d.question?.correctAnswer ?? "",
      question: d.question
        ? {
            id: d.question.id,
            sectionId: d.question.sectionId,
            questionText: d.question.questionText ?? "",
            optionA: d.question.optionA ?? "",
            optionB: d.question.optionB ?? "",
            optionC: d.question.optionC ?? "",
            optionD: d.question.optionD ?? "",
            explanation: d.question.explanation ?? undefined,
          }
        : {
            id: 0,
            sectionId: 0,
            questionText: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
          },
    })),
  };

  return <MockTestResultScreen result={result} />;
}
