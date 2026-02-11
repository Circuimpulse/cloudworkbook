import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSectionById, getQuestionsBySection, getSectionProgress } from "@/lib/db/queries";
import { SectionQuiz } from "@/components/section-quiz";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SectionPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const sectionId = parseInt(id, 10);

  if (isNaN(sectionId)) {
    redirect("/sections");
  }

  // セクションと問題を取得
  const section = await getSectionById(sectionId);
  const questions = await getQuestionsBySection(sectionId);
  const progress = await getSectionProgress(userId, sectionId);

  if (!section) {
    redirect("/sections");
  }

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SectionQuiz
        section={section}
        questions={questions}
        userId={userId}
        initialProgress={progress}
      />
    </div>
  );
}
