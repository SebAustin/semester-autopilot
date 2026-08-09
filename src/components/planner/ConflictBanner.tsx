"use client";

import type { PlanConflict } from "@/lib/types";

const KIND_STYLES: Record<
  PlanConflict["kind"],
  { container: string; label: string; labelText: string }
> = {
  "due-date-passed": {
    container: "border-danger/30 bg-danger-soft",
    label: "text-danger",
    labelText: "Past due",
  },
  "impossible-deadline": {
    container: "border-danger/30 bg-danger-soft",
    label: "text-danger",
    labelText: "Won't fit",
  },
  "overcommitted-week": {
    container: "border-warn/40 bg-warn-soft",
    label: "text-warn",
    labelText: "Heavy week",
  },
};

type Props = {
  conflicts: PlanConflict[];
};

export function ConflictBanner({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <section aria-label="Plan conflicts" className="grid gap-2">
      {conflicts.map((conflict, index) => {
        const style = KIND_STYLES[conflict.kind];
        return (
          <div
            key={`${conflict.kind}-${conflict.weekStart ?? index}`}
            role="status"
            className={`flex items-baseline gap-3 rounded-md border px-4 py-2.5 ${style.container}`}
          >
            <span
              className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${style.label}`}
            >
              {style.labelText}
            </span>
            <p className="text-sm text-ink-soft">{conflict.message}</p>
          </div>
        );
      })}
    </section>
  );
}
