import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMockTestHistory } from "@/backend/db/queries";
import HistoryScreen from "@/frontend/screens/history";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 履歴を取得（最新50件まで）
  const history = await getMockTestHistory(userId, 50);

  return <HistoryScreen history={history} />;
}
