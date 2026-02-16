import { getAllFavoriteQuestions } from "../backend/db/queries";

async function main() {
  try {
    const userId = "user_39VwVOBzAPosgmh5FENgboDP4IK"; // From previous output
    console.log("Fetching for user:", userId);
    const favorites = await getAllFavoriteQuestions(userId);
    console.log("Total favorites:", favorites.length);
    if (favorites.length > 0) {
      console.log(
        "First favorite structure:",
        JSON.stringify(favorites[0], null, 2),
      );
    } else {
      console.log("No favorites found.");
    }
  } catch (error) {
    console.error("Error fetching favorites:", error);
  }
}

main();
