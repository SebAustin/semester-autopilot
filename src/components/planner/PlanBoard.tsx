"use client";

import { useMemo, useState } from "react";
import { LayoutGroup, MotionConfig } from "motion/react";

import { addDays, todayISO, weekdayOf } from "@/lib/dates/iso";
import { useAppStore } from "@/lib/store/useAppStore";
import type { ISODate, Plan, StudyBlock } from "@/lib/types";

import { DayCell } from "./DayCell";

const BOARD_DAYS = 14;

type Props = {
  plan: Plan;
};

function signatureOf(blocks: StudyBlock[]): string {
  return blocks.map((block) => `${block.key}:${block.hours}`).join("|");
}

function sameSignatures(
  a: Record<ISODate, string>,
  b: Record<ISODate, string>,
): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

interface BoardSnapshot {
  signatures: Record<ISODate, string>;
  changed: Set<ISODate>;
}

export function PlanBoard({ plan }: Props) {
  const courses = useAppStore((state) => state.courses);
  const deliverables = useAppStore((state) => state.deliverables);
  const weeklyHours = useAppStore((state) => state.availability.weeklyHours);
  const blackoutDates = useAppStore(
    (state) => state.availability.blackoutDates,
  );
  const toggleBlackout = useAppStore((state) => state.toggleBlackout);

  const today = todayISO();
  const days = useMemo(
    () => Array.from({ length: BOARD_DAYS }, (_, i) => addDays(today, i)),
    [today],
  );
  const blackouts = new Set(blackoutDates);

  const blocksByDate = useMemo(() => {
    const map = new Map<ISODate, StudyBlock[]>();
    for (const block of plan.blocks) {
      map.set(block.date, [...(map.get(block.date) ?? []), block]);
    }
    return map;
  }, [plan.blocks]);

  const currentSignatures = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [day, signatureOf(blocksByDate.get(day) ?? [])]),
      ) as Record<ISODate, string>,
    [days, blocksByDate],
  );

  // "Adjust state during render": when the plan's day-signatures change, the
  // diff against the previous snapshot marks which day columns get the
  // one-shot reroute pulse. No refs in render, concurrent-safe.
  const [snapshot, setSnapshot] = useState<BoardSnapshot>(() => ({
    signatures: currentSignatures,
    changed: new Set<ISODate>(),
  }));
  if (
    snapshot.signatures !== currentSignatures &&
    !sameSignatures(snapshot.signatures, currentSignatures)
  ) {
    setSnapshot({
      signatures: currentSignatures,
      changed: new Set(
        days.filter(
          (day) => (snapshot.signatures[day] ?? "") !== currentSignatures[day],
        ),
      ),
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <section aria-label="Next two weeks" className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h2 font-display text-ink">Next two weeks</h2>
          <p className="text-xs text-ink-faint">
            Tap{" "}
            <span className="font-medium text-ink-soft">
              {"“I'm busy”"}
            </span>{" "}
            on any day and watch the plan reroute.
          </p>
        </div>
        <LayoutGroup>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((date) => (
              <DayCell
                key={date}
                date={date}
                isToday={date === today}
                isBlackout={blackouts.has(date)}
                pulseKey={
                  snapshot.changed.has(date)
                    ? currentSignatures[date]
                    : undefined
                }
                capacityHours={
                  blackouts.has(date) ? 0 : weeklyHours[weekdayOf(date)]
                }
                blocks={blocksByDate.get(date) ?? []}
                courses={courses}
                deliverables={deliverables}
                onToggleBusy={toggleBlackout}
              />
            ))}
          </div>
        </LayoutGroup>
      </section>
    </MotionConfig>
  );
}
