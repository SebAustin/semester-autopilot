import type { ReactNode } from "react";

import { AppNav } from "@/components/shared/AppNav";
import { HydrationGate } from "@/components/shared/HydrationGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main className="flex-1">
        <HydrationGate>{children}</HydrationGate>
      </main>
    </div>
  );
}
