import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { SettingsScreen } from "@/components/dashboard/SettingsScreen";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <StoreProvider>
      <SettingsScreen />
    </StoreProvider>
  );
}
