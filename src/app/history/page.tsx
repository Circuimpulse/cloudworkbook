import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getMockTestHistory,
  getAllIncorrectQuestions,
  getAllFavoriteQuestions,
  getAllExams,
} from "@/backend/db/queries";
import HistoryScreen from "@/frontend/screens/LearningHistoryScreen";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; examId?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { tab, examId: examIdParam } = await searchParams;
  const initialTab =
    tab === "history" || tab === "incorrect" || tab === "favorite"
      ? tab
      : "history";

  // 試験一覧を取得
  const exams = await getAllExams();

  // examIdを決定（パラメータ → デフォルト=最初の試験）
  const selectedExamId = examIdParam
    ? parseInt(examIdParam, 10)
    : exams.length > 0
      ? exams[0].id
      : undefined;

  // 試験別にデータを取得
  const history = await getMockTestHistory(userId, 20, selectedExamId);
  const incorrectQuestions = await getAllIncorrectQuestions(
    userId,
    selectedExamId,
  );
  const favoriteQuestions = await getAllFavoriteQuestions(
    userId,
    selectedExamId,
  );

  // Serialize data to avoid "Date object cannot be passed to Client Component" error
  const serializedHistory = JSON.parse(JSON.stringify(history));
  const serializedIncorrect = JSON.parse(JSON.stringify(incorrectQuestions));
  const serializedFavorites = JSON.parse(JSON.stringify(favoriteQuestions));

  return (
    <HistoryScreen
      exams={exams}
      selectedExamId={selectedExamId}
      history={serializedHistory}
      incorrectQuestions={serializedIncorrect}
      favoriteQuestions={serializedFavorites}
      initialTab={initialTab}
    />
  );
}
