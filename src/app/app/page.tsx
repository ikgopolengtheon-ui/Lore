import { StoreProvider } from "@/lib/store";
import { LoreApp } from "@/components/LoreApp";

// The product itself lives at /app; the marketing landing page is at /.
export default function AppPage() {
  return (
    <StoreProvider>
      <LoreApp />
    </StoreProvider>
  );
}
