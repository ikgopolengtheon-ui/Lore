import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";

export const metadata: Metadata = { title: "Dashboard" };

// The app's home page — where login/signup lands. Chats, question counts,
// and documents are live from the store; study-time/quiz stats are
// representative until usage tracking lands.
export default function DashboardPage() {
  return (
    <StoreProvider>
      <DashboardScreen />
    </StoreProvider>
  );
}
