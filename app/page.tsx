import { getAllExams } from "@/backend/db/queries";
import TopScreen from "@/frontend/screens/TopScreen";

export default async function Page() {
  const exams = await getAllExams();
  
  return <TopScreen exams={exams} />;
}
