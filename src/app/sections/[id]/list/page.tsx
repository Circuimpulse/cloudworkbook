import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getSectionWithExam,
  getSectionProgress,
  getSectionQuestionsProgress,
  getQuestionsBySection,
  getSectionsByExamId,
} from "@/backend/db/queries";
import QuestionListScreen from "@/frontend/screens/QuestionListScreen";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

// キャッシュを無効化して、常に最新のデータを取得
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params, searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const sectionId = parseInt(id, 10);

  if (isNaN(sectionId)) {
    redirect("/");
  }

  // searchParamsを取得
  const search = await searchParams;
  const fromCompletion = search.from === "completion";

  // セクション情報を取得（試験情報含む）
  const sectionData = await getSectionWithExam(sectionId);

  if (!sectionData || !sectionData.section) {
    redirect("/");
  }

  const { section, exam } = sectionData;

  // セクションの問題を取得
  const questions = await getQuestionsBySection(sectionId);

  // 進捗状況を取得
  let progress = await getSectionProgress(userId, sectionId);
  const questionsProgress = await getSectionQuestionsProgress(
    userId,
    sectionId,
  );

  // 進捗がない場合は初期値を作成
  if (!progress) {
    progress = {
      userId,
      sectionId,
      correctCount: 0,
      totalCount: 0,
      lastStudiedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 同じ試験の全セクションを取得
  const sections = exam
    ? (await getSectionsByExamId(exam.id)).map((s) => ({
        ...s,
        exam,
        examId: exam.id, // 明示的に追加
      }))
    : [{ ...section, exam, examId: section.examId }];

  return (
    <QuestionListScreen
      sections={sections}
      progressList={[progress]}
      questionsProgress={questionsProgress}
      initialSectionId={sectionId}
      currentQuestions={questions}
      fromCompletion={fromCompletion}
    />
  );
}
