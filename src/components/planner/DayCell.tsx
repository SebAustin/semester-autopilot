"use client";

import { courseChipStyle } from "@/components/shared/course-colors";
import { formatShort, weekdayOf } from "@/lib/dates/iso";
import type { Course, Deliverable, ISODate, StudyBlock } from "@/lib/types";

type Props = {
  date: ISODate;
  isToday: boolean;
  capacityHours: number;
  blocks: StudyBlock[];
  courses: Record<string, Course>;
  deliverables: Record<string, Deliverable>;
};

export function DayCell({
  date,
  isToday,
  capacityHours,
  blocks,
  courses,
  deliverables,
}: Props) {
  const planned = blocks.reduce((acc, block) => acc + block.hours, 0);
  const weekday = weekdayOf(date);

  return (
    <div
      data-date={date}
      data-weekday={weekday}
      data-planned={planned}
      className={`flex min-h-36 flex-col rounded-md border p-2 ${
        isToday ? "border-accent bg-accent-soft/40" : "border-line bg-surface"
      }`}
    >
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

      <div className="mt-2 flex flex-col gap-1.5">
        {blocks.map((block) => {
          const deliverable = deliverables[block.deliverableId];
          const course = courses[block.courseId];
          if (!deliverable || !course) return null;
          return (
            <div
              key={block.key}
              data-testid="study-block"
              className="rounded-sm border border-line/70 bg-paper px-2 py-1.5"
              style={{
                borderLeft: `3px solid var(--color-course-${course.colorIndex})`,
              }}
            >
              <p className="truncate text-xs text-ink" title={deliverable.title}>
                {deliverable.title}
              </p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span
                  className="rounded-[3px] px-1 text-[9px] font-semibold"
                  style={courseChipStyle(course.colorIndex)}
                >
                  {course.name}
                </span>
                <span className="tnum text-[10px] text-ink-faint">
                  {block.hours}h
                </span>
              </div>
            </div>
          );
        })}
        {blocks.length === 0 && capacityHours > 0 ? (
          <p className="mt-4 text-center text-[10px] text-ink-faint">free</p>
        ) : null}
        {capacityHours === 0 ? (
          <p className="mt-4 text-center text-[10px] text-ink-faint">
            no study hours
          </p>
        ) : null}
      </div>
    </div>
  );
}
