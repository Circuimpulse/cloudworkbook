import { db } from "../backend/db/client";
import { userQuestionRecords } from "../backend/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const records = await db.select().from(userQuestionRecords).all();
    console.log("Total records:", records.length);
    const favorites = records.filter(
      (r) => r.isFavorite || r.isFavorite1 || r.isFavorite2 || r.isFavorite3,
    );
    console.log("Favorite records:", favorites.length);
    console.log(JSON.stringify(favorites, null, 2));
  } catch (error) {
    console.error("Error fetching records:", error);
  }
}

main();
