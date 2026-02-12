import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getAllSectionsWithExams, // 変更
  getAllSectionProgress,
  getAllSectionQuestionsProgress,
  getQuestionsBySection,
} from "@/backend/db/queries";
import ListScreen from "@/frontend/screens/list";

interface PageProps {
  searchParams: Promise<{ sectionId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const rawSections = await getAllSectionsWithExams();
  const sections = rawSections.map((r) => ({
    ...r.section,
    exam: r.exam,
  }));

  const progressList = await getAllSectionProgress(userId);
  const questionsProgress = await getAllSectionQuestionsProgress(userId);

  // URLパラメータからsectionIdを取得
  const params = await searchParams;
  const sectionId = params.sectionId
    ? parseInt(params.sectionId, 10)
    : undefined;

  // 現在のセクションID（初期値はセクション1）
  const currentSectionId = sectionId || sections[0]?.id || 1;

  // 現在のセクションの問題を取得
  const currentQuestions = await getQuestionsBySection(currentSectionId);

  return (
    <ListScreen
      sections={sections}
      progressList={progressList}
      questionsProgress={questionsProgress}
      initialSectionId={sectionId}
      currentQuestions={currentQuestions}
    />
  );
}
