import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getQuestionsBySection,
  getSectionWithExam,
  getSectionQuestionsProgress,
  getAdjacentSections,
} from "@/backend/db/queries";
import QuizesScreen from "@/frontend/screens/quizes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const sectionId = parseInt(id, 10);

  if (isNaN(sectionId)) {
    redirect("/sections");
  }

  const data = await getSectionWithExam(sectionId);
  const questions = await getQuestionsBySection(sectionId);
  const progress = await getSectionQuestionsProgress(userId, sectionId);
  const { prevSection, nextSection } = await getAdjacentSections(sectionId);

  if (!data || !data.section) {
    redirect("/sections");
  }

  const { section, exam } = data;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">問題がありません</h1>
          <p className="text-muted-foreground">
            このセクションにはまだ問題が登録されていません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <QuizesScreen
      section={section}
      questions={questions}
      userId={userId}
      initialProgress={progress}
      exam={exam || undefined}
      prevSection={prevSection || undefined}
      nextSection={nextSection || undefined}
    />
  );
}
