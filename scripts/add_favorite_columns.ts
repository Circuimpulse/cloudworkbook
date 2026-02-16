import { db } from "../backend/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding is_favorite_1 column...");
    await db.run(
      sql`ALTER TABLE user_question_records ADD COLUMN is_favorite_1 integer DEFAULT 0`,
    );
    console.log("Added is_favorite_1 column.");
  } catch (error) {
    if (String(error).includes("duplicate column name")) {
      console.log("Column is_favorite_1 already exists.");
    } else {
      console.error("Failed to add is_favorite_1:", error);
    }
  }

  try {
    console.log("Adding is_favorite_2 column...");
    await db.run(
      sql`ALTER TABLE user_question_records ADD COLUMN is_favorite_2 integer DEFAULT 0`,
    );
    console.log("Added is_favorite_2 column.");
  } catch (error) {
    if (String(error).includes("duplicate column name")) {
      console.log("Column is_favorite_2 already exists.");
    } else {
      console.error("Failed to add is_favorite_2:", error);
    }
  }

  try {
    console.log("Adding is_favorite_3 column...");
    await db.run(
      sql`ALTER TABLE user_question_records ADD COLUMN is_favorite_3 integer DEFAULT 0`,
    );
    console.log("Added is_favorite_3 column.");
  } catch (error) {
    if (String(error).includes("duplicate column name")) {
      console.log("Column is_favorite_3 already exists.");
    } else {
      console.error("Failed to add is_favorite_3:", error);
    }
  }

  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
