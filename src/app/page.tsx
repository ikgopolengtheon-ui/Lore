import { StoreProvider } from "@/lib/store";
import { LoreApp } from "@/components/LoreApp";

export default function Home() {
  return (
    <StoreProvider>
      <LoreApp />
    </StoreProvider>
  );
}
