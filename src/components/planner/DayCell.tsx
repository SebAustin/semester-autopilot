"use client";

import { AnimatePresence, motion } from "motion/react";

import { formatShort, weekdayOf } from "@/lib/dates/iso";
import type { Course, Deliverable, ISODate, StudyBlock } from "@/lib/types";

import { StudyBlockCard } from "./StudyBlockCard";

type Props = {
  date: ISODate;
  isToday: boolean;
  isBlackout: boolean;
  /** Set when this day's plan just changed — keys the one-shot reroute pulse */
  pulseKey?: string;
  capacityHours: number;
  blocks: StudyBlock[];
  courses: Record<string, Course>;
  deliverables: Record<string, Deliverable>;
  onToggleBusy: (date: ISODate) => void;
};

export function DayCell({
  date,
  isToday,
  isBlackout,
  pulseKey,
  capacityHours,
  blocks,
  courses,
  deliverables,
  onToggleBusy,
}: Props) {
  const planned = blocks.reduce((acc, block) => acc + block.hours, 0);
  const weekday = weekdayOf(date);

  return (
    <div
      data-date={date}
      data-weekday={weekday}
      data-planned={planned}
      className={`relative flex min-h-40 flex-col rounded-md border p-2 ${
        isToday
          ? "border-accent bg-accent-soft/40"
          : isBlackout
            ? "border-warn/50 bg-warn-soft/50"
            : "border-line bg-surface"
      }`}
    >
      {pulseKey !== undefined ? (
        <motion.span
          key={pulseKey}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, times: [0, 0.25, 1] }}
          className="pointer-events-none absolute -inset-px rounded-md border-2 border-accent"
        />
      ) : null}

      <div className="flex items-baseline justify-between">
        <p
          className={`text-xs font-semibold ${
            isToday ? "text-accent-strong" : "text-ink-soft"
          }`}
        >
          {weekday}{" "}
          <span className="tnum font-normal text-ink-faint">
            {formatShort(date)}
          </span>
        </p>
        <p className="tnum text-[10px] text-ink-faint">
          {planned}/{capacityHours}h
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleBusy(date)}
        aria-pressed={isBlackout}
        aria-label={
          isBlackout
            ? `Unmark ${formatShort(date)} as busy`
            : `Mark ${formatShort(date)} as busy`
        }
        className={`mt-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-150 ${
          isBlackout
            ? "bg-warn-strong text-white hover:opacity-85"
            : "border border-line text-ink-faint hover:border-warn-strong hover:text-warn-strong"
        }`}
      >
        {isBlackout ? "busy — undo" : "I'm busy"}
      </button>

      <div className="mt-2 flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {blocks.map((block) => {
            const deliverable = deliverables[block.deliverableId];
            const course = courses[block.courseId];
            if (!deliverable || !course) return null;
            return (
              <StudyBlockCard
                key={block.key}
                block={block}
                course={course}
                deliverable={deliverable}
              />
            );
          })}
        </AnimatePresence>
        {blocks.length === 0 && !isBlackout && capacityHours > 0 ? (
          <p className="mt-4 text-center text-[10px] text-ink-faint">free</p>
        ) : null}
        {isBlackout ? (
          <p className="mt-4 text-center text-[10px] text-warn-strong">
            rerouted around this day
          </p>
        ) : null}
        {!isBlackout && capacityHours === 0 ? (
          <p className="mt-4 text-center text-[10px] text-ink-faint">
            no study hours
          </p>
        ) : null}
      </div>
    </div>
  );
}
