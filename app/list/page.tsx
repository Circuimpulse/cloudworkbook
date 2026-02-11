import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllSections, getAllSectionProgress } from "@/backend/db/queries";
import ListScreen from "@/frontend/screens/list";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const sections = await getAllSections();
  const progressList = await getAllSectionProgress(userId);

  return <ListScreen sections={sections} progressList={progressList} />;
}
