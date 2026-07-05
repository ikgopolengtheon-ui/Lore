import type { Metadata } from "next";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";

export const metadata: Metadata = { title: "Dashboard" };

// Analytics dashboard (visual prototype — the numbers are representative
// mock data until real usage tracking lands).
export default function DashboardPage() {
  return <DashboardScreen />;
}
