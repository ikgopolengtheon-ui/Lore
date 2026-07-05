import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { QuizzesScreen } from "@/components/dashboard/QuizzesScreen";

export const metadata: Metadata = { title: "Quizzes" };

// Pick a study chat and quiz yourself on its material. Selecting one deep
// links into the session at /app in quiz mode.
export default function QuizzesPage() {
  return (
    <StoreProvider>
      <QuizzesScreen />
    </StoreProvider>
  );
}
