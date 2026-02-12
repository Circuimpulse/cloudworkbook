import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MockTestScreen from "@/frontend/screens/mock-test";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <MockTestScreen />;
}
