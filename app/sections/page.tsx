import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllSections } from "@/backend/db/queries";
import SectionScreen from "@/frontend/screens/section";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const sections = await getAllSections();

  return <SectionScreen sections={sections} />;
}
