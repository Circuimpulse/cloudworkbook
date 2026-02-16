import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSectionsByExamId, getExamById } from "@/backend/db/queries";
import SectionSelectScreen from "@/frontend/screens/SectionSelectScreen";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

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
