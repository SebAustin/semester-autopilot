"use client";

import { formatShort, todayISO, weekStartOf } from "@/lib/dates/iso";
import type { Deliverable, ISODate } from "@/lib/types";
import { dueHoursByWeek } from "@/lib/workload";

type Props = {
  deliverables: Deliverable[];
  weeks: ISODate[];
};

export function WorkloadHeatmap({ deliverables, weeks }: Props) {
  const byWeek = dueHoursByWeek(deliverables);
  const max = Math.max(1, ...Object.values(byWeek));
  const currentWeek = weekStartOf(todayISO());

  return (
    <section aria-label="Workload by week" className="mt-6">
      <h3 className="text-sm font-medium text-ink-soft">
        Hours coming due, by week
      </h3>
      <div className="mt-2 flex gap-1" role="img" aria-label="Workload heatmap">
        {weeks.map((week) => {
          const hours = byWeek[week] ?? 0;
          const intensity = hours === 0 ? 0 : 15 + (hours / max) * 80;
          const isCurrent = week === currentWeek;
          return (
            <div
              key={week}
              title={`Week of ${formatShort(week)}: ${hours}h due`}
              className={`h-9 flex-1 rounded-sm border ${
                isCurrent ? "border-accent" : "border-transparent"
              }`}
              style={{
                backgroundColor:
                  intensity === 0
                    ? "var(--color-paper)"
                    : `color-mix(in oklab, var(--color-accent) ${Math.round(intensity)}%, var(--color-paper))`,
              }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between">
        <span className="tnum text-[10px] text-ink-faint">
          {weeks.length > 0 ? formatShort(weeks[0]) : ""}
        </span>
        <span className="tnum text-[10px] text-ink-faint">
          peak {Math.round(max)}h
        </span>
        <span className="tnum text-[10px] text-ink-faint">
          {weeks.length > 0 ? formatShort(weeks[weeks.length - 1]) : ""}
        </span>
      </div>
    </section>
  );
}
