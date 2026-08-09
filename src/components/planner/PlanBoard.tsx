"use client";

import { addDays, todayISO, weekdayOf } from "@/lib/dates/iso";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Plan } from "@/lib/types";

import { DayCell } from "./DayCell";

const BOARD_DAYS = 14;

type Props = {
  plan: Plan;
};

export function PlanBoard({ plan }: Props) {
  const courses = useAppStore((state) => state.courses);
  const deliverables = useAppStore((state) => state.deliverables);
  const weeklyHours = useAppStore((state) => state.availability.weeklyHours);
  const blackoutDates = useAppStore(
    (state) => state.availability.blackoutDates,
  );

  const today = todayISO();
  const days = Array.from({ length: BOARD_DAYS }, (_, i) => addDays(today, i));
  const blackouts = new Set(blackoutDates);
  const blocksByDate = new Map<string, Plan["blocks"]>();
  for (const block of plan.blocks) {
    blocksByDate.set(block.date, [
      ...(blocksByDate.get(block.date) ?? []),
      block,
    ]);
  }

  return (
    <section aria-label="Next two weeks" className="mt-6">
      <h2 className="text-h2 font-display text-ink">Next two weeks</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((date) => (
          <DayCell
            key={date}
            date={date}
            isToday={date === today}
            capacityHours={
              blackouts.has(date) ? 0 : weeklyHours[weekdayOf(date)]
            }
            blocks={blocksByDate.get(date) ?? []}
            courses={courses}
            deliverables={deliverables}
          />
        ))}
      </div>
    </section>
  );
}
