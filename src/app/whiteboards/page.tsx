import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { WhiteboardsScreen } from "@/components/dashboard/WhiteboardsScreen";

export const metadata: Metadata = { title: "Whiteboards" };

// Every chat's saved whiteboard, in one place. Opening one deep links into
// the session at /app where the board lives.
export default function WhiteboardsPage() {
  return (
    <StoreProvider>
      <WhiteboardsScreen />
    </StoreProvider>
  );
}
