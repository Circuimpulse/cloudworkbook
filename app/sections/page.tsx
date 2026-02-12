import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getAllSectionsWithExams,
  getSectionsByExamId,
  getExamById,
} from "@/backend/db/queries";
import SectionScreen from "@/frontend/screens/section";

interface PageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  let sections;
  let exam;

  if (params.examId) {
    const examId = parseInt(params.examId, 10);
    if (!isNaN(examId)) {
      // 特定の試験区分のセクションのみ取得
      sections = await getSectionsByExamId(examId);
      exam = await getExamById(examId);
    } else {
      const results = await getAllSectionsWithExams();
      sections = results.map((r) => ({
        ...r.section,
        examTitle: r.exam?.title,
      }));
    }
  } else {
    const results = await getAllSectionsWithExams();
    sections = results.map((r) => ({
      ...r.section,
      examTitle: r.exam?.title,
    }));
  }

  return <SectionScreen sections={sections} exam={exam || undefined} />;
}
