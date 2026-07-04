import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata: Metadata = { title: "Sign in" };

// Dedicated sign-in / sign-up page. The right-hand panel shows the lamp
// photograph when public/auth-lamp.jpg exists; otherwise AuthScreen renders
// its CSS recreation of the same scene, so the page never looks unfinished.
export default function AuthPage() {
  const hasPhoto = fs.existsSync(
    path.join(process.cwd(), "public", "auth-lamp.jpg"),
  );
  return (
    <StoreProvider>
      <AuthScreen photo={hasPhoto ? "/auth-lamp.jpg" : null} />
    </StoreProvider>
  );
}
