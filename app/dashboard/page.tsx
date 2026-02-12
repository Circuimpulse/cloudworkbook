import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getAllSections,
  getAllSectionProgress,
  getMockTestHistory,
  getAllExams,
} from "@/backend/db/queries";
import DashboardScreen from "@/frontend/screens/dashboard";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const sections = await getAllSections();
  const progressList = await getAllSectionProgress(userId);
  const mockTests = await getMockTestHistory(userId, 5);
  const exams = await getAllExams();

  return (
    <DashboardScreen
      sections={sections}
      progressList={progressList}
      mockTests={mockTests}
      exams={exams}
    />
  );
}
