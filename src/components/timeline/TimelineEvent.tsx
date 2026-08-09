"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

import { formatLong } from "@/lib/dates/iso";
import { effectiveWeightPct } from "@/lib/grades/calc";
import type { Course, Deliverable } from "@/lib/types";

const MID_WEIGHT_PCT = 3;
const HIGH_WEIGHT_PCT = 8;

function sizeClass(weight: number): string {
  if (weight >= HIGH_WEIGHT_PCT) return "h-4 w-4";
  if (weight >= MID_WEIGHT_PCT) return "h-3 w-3";
  return "h-2 w-2";
}

type Props = {
  deliverable: Deliverable;
  course: Course;
  courseDeliverables: Deliverable[];
  leftPct: number;
};

export function TimelineEvent({
  deliverable,
  course,
  courseDeliverables,
  leftPct,
}: Props) {
  const weight = effectiveWeightPct(deliverable, course, courseDeliverables);
  const isExam = deliverable.type === "exam";
  const isDone = deliverable.status !== "pending";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          data-testid="timeline-tick"
          aria-label={`${course.name}: ${deliverable.title}, ${formatLong(deliverable.dueDate)}`}
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out hover:scale-125 focus-visible:scale-125 ${sizeClass(weight)} ${
            isExam ? "rotate-45 rounded-[3px]" : "rounded-full"
          } ${isDone ? "opacity-30" : ""}`}
          style={{
            left: `${leftPct}%`,
            backgroundColor: `var(--color-course-${course.colorIndex})`,
          }}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={8}
          className="z-50 max-w-64 rounded-md border border-line bg-surface px-3 py-2 shadow-lg"
        >
          <p className="text-sm font-medium text-ink">{deliverable.title}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {course.name} · {deliverable.type}
            {isDone ? " · done" : ""}
          </p>
          <p className="tnum mt-1 text-xs text-ink-soft">
            {formatLong(deliverable.dueDate)}
            {weight > 0 ? ` · ${Math.round(weight * 10) / 10}% of grade` : ""}
            {` · ~${deliverable.estimatedHours}h`}
          </p>
          <Tooltip.Arrow className="fill-line" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
