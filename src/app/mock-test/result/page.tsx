import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MockTestResultScreen from "@/frontend/screens/MockTestResultScreen";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <MockTestResultScreen />;
}
