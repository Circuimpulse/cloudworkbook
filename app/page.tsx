import { getAllExams } from "@/backend/db/queries";
import TopScreen from "@/frontend/screens/top";

export default async function Page() {
  const exams = await getAllExams();
  
  return <TopScreen exams={exams} />;
}
