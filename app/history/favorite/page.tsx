import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import IncorrectQuestionsScreen from "@/frontend/screens/IncorrectQuestionsScreen";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const examId = params.examId ? parseInt(params.examId, 10) : null;

  if (!examId || isNaN(examId)) {
    redirect("/");
  }

  const { getExamById } = await import("@/backend/db/queries");
  const exam = await getExamById(examId);

  if (!exam) {
    redirect("/");
  }

  // mode="favorite" propを追加して、お気に入り表示モードとして再利用する
  // IncorrectQuestionsScreenは名前がIncorrectですが、リスト表示のロジックはほぼ同じなので
  // mode propを追加して使い分けるのが良さそう。
  // しかし、IncorrectQuestionsScreenはAPI `/api/exams/${examId}/incorrect-questions` を叩いている。
  // お気に入り用のAPI `/api/exams/${examId}/favorite-questions` が必要。

  return (
    <IncorrectQuestionsScreen examId={examId} exam={exam} mode="favorite" />
  );
}
