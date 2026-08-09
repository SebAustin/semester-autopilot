"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { DEMO_VERSION } from "@/lib/demo/syllabi";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * Blocks store-driven UI until zustand has rehydrated from localStorage
 * (persist is configured with skipHydration). The server and first client
 * paint both show this skeleton, so SSR markup can never mismatch
 * client-persisted state.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const isHydrated = useSyncExternalStore(
    (onStoreChange) => useAppStore.persist.onFinishHydration(onStoreChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  // A browser that loaded an older demo (e.g. a judge who clicked "try demo"
  // before a content update) silently gets the current demo semester.
  useEffect(() => {
    if (!isHydrated) return;
    const state = useAppStore.getState();
    if (state.demoLoadedAt && state.demoVersion !== DEMO_VERSION) {
      state.loadDemoData();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div aria-busy="true" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="h-7 w-56 animate-pulse rounded-sm bg-line" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-36 animate-pulse rounded-lg bg-line/60" />
          <div className="h-36 animate-pulse rounded-lg bg-line/40" />
          <div className="h-36 animate-pulse rounded-lg bg-line/25" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
