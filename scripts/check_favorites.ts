import { db } from "../backend/db/client";
import { userQuestionRecords } from "../backend/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const records = await db.select().from(userQuestionRecords).all();
    console.log("Total records:", records.length);
    records.forEach((r) => {
      console.log(
        `User: ${r.userId}, Q: ${r.questionId}, Fav: ${r.isFavorite}, Fav1: ${r.isFavorite1}, Fav2: ${r.isFavorite2}, Fav3: ${r.isFavorite3}`,
      );
    });
  } catch (error) {
    console.error("Error fetching records:", error);
  }
}

main();
