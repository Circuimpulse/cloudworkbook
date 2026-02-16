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

  return <IncorrectQuestionsScreen examId={examId} exam={exam} />;
}
