import { redirect } from "next/navigation";
import { getSectionsByExamId, getExamById } from "@/backend/db/queries";
import SectionSelectScreen from "@/frontend/screens/SectionSelectScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

// 認証はmiddleware.tsで処理（/exams(.*)はprotectedRoute）
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const examId = parseInt(id, 10);

  if (isNaN(examId)) {
    redirect("/");
  }

  const exam = await getExamById(examId);

  if (!exam) {
    redirect("/");
  }

  const sections = await getSectionsByExamId(examId);

  return <SectionSelectScreen sections={sections} exam={exam} />;
}
