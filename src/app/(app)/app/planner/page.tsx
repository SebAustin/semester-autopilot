"use client";

import Link from "next/link";

import { AvailabilityEditor } from "@/components/planner/AvailabilityEditor";
import { ConflictBanner } from "@/components/planner/ConflictBanner";
import { PlanBoard } from "@/components/planner/PlanBoard";
import { DemoDataButton } from "@/components/shared/DemoDataButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePlan } from "@/lib/store/selectors";
import { useAppStore } from "@/lib/store/useAppStore";

export default function PlannerPage() {
  const courses = useAppStore((state) => state.courses);
  const plan = usePlan();

  if (Object.keys(courses).length === 0) {
    return (
      <EmptyState
        kicker="Autopilot"
        headline="No flight plan without a semester."
        body="Load the demo semester or add a course, then Autopilot spreads the work across your available hours — and reroutes when life happens."
      >
        <DemoDataButton />
        <Link
          href="/app/ingest"
          className="inline-flex items-center rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          Add a course
        </Link>
      </EmptyState>
    );
  }

  const busiest = Object.entries(plan.stats.byWeek).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Autopilot
          </p>
          <h1 className="mt-2 font-display text-h1 text-ink">Study plan</h1>
        </div>
        <p className="tnum text-sm text-ink-soft" data-testid="plan-stats">
          <span className="font-semibold text-ink">{plan.stats.totalHours}h</span>{" "}
          planned
          {busiest ? (
            <span className="text-ink-faint"> · busiest week {busiest[1]}h</span>
          ) : null}
          {plan.conflicts.length > 0 ? (
            <span className="text-danger">
              {" "}
              · {plan.conflicts.length} conflict
              {plan.conflicts.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <AvailabilityEditor />
        <ConflictBanner conflicts={plan.conflicts} />
      </div>

      <PlanBoard plan={plan} />

      <p className="mt-6 text-xs text-ink-faint">
        The plan recomputes instantly from your deadlines, grade weights, and
        hours — deterministic, no AI involved. Tomorrow&apos;s build: mark a day
        as missed and watch it reroute.
      </p>
    </div>
  );
}
