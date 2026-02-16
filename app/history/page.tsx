import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getMockTestHistory,
  getAllIncorrectQuestions,
  getAllFavoriteQuestions,
} from "@/backend/db/queries";
import HistoryScreen from "@/frontend/screens/LearningHistoryScreen";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { tab } = await searchParams;
  const initialTab =
    tab === "history" || tab === "incorrect" || tab === "favorite"
      ? tab
      : "history";

  const history = await getMockTestHistory(userId);
  const incorrectQuestions = await getAllIncorrectQuestions(userId);
  const favoriteQuestions = await getAllFavoriteQuestions(userId);

  // Serialize data to avoid "Date object cannot be passed to Client Component" error
  const serializedHistory = JSON.parse(JSON.stringify(history));
  const serializedIncorrect = JSON.parse(JSON.stringify(incorrectQuestions));
  const serializedFavorites = JSON.parse(JSON.stringify(favoriteQuestions));

  return (
    <HistoryScreen
      history={serializedHistory}
      incorrectQuestions={serializedIncorrect}
      favoriteQuestions={serializedFavorites}
      initialTab={initialTab}
    />
  );
}
