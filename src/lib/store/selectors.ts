import { useMemo, useState } from "react";

import { todayISO } from "../dates/iso";
import { buildPlan } from "../scheduler/engine";
import type { Plan } from "../types";
import { useAppStore } from "./useAppStore";

/**
 * The plan is DERIVED state: recomputed (memoized) from inputs on every
 * relevant change, never persisted. Recompute is sub-millisecond for a
 * realistic semester, so "reroute" is literally just React re-rendering
 * against a fresh buildPlan result.
 */
export function usePlan(): Plan {
  const deliverables = useAppStore((state) => state.deliverables);
  const courses = useAppStore((state) => state.courses);
  const availability = useAppStore((state) => state.availability);
  // Stable for the lifetime of the mount — the engine must never read the clock.
  const [today] = useState(() => todayISO());

  return useMemo(
    () =>
      buildPlan({
        deliverables: Object.values(deliverables),
        courses,
        availability,
        today,
      }),
    [deliverables, courses, availability, today],
  );
}
