import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MockTestResultScreen from "@/frontend/screens/MockTestResultScreen";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // sessionStorageモードで結果画面を表示
  return <MockTestResultScreen fromSession={true} />;
}
