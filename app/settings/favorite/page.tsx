import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FavoriteSettingsScreen from "@/frontend/screens/FavoriteSettingsScreen";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <FavoriteSettingsScreen />;
}

