import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store";
import { LoreApp } from "@/components/LoreApp";

export const metadata: Metadata = { title: "Study" };

// The study flow lives at /app (chats list -> upload -> study -> quiz); the
// app's home is /dashboard. Suspense: LoreApp reads deep-link params
// (?new / ?session / ?mode) via useSearchParams.
export default function AppPage() {
  return (
    <StoreProvider>
      <Suspense>
        <LoreApp />
      </Suspense>
    </StoreProvider>
  );
}
