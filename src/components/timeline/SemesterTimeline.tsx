"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

import { courseChipStyle } from "@/components/shared/course-colors";
import { diffDays, formatShort, todayISO } from "@/lib/dates/iso";
import type { TimelineRange } from "@/lib/timeline-range";
import type { Course, Deliverable, ISODate } from "@/lib/types";

import { TimelineEvent } from "./TimelineEvent";

type Props = {
  courses: Course[];
  deliverables: Deliverable[];
  range: TimelineRange;
};

export function SemesterTimeline({ courses, deliverables, range }: Props) {
  const today = todayISO();
  const totalDays = Math.max(1, diffDays(range.start, range.end));
  const pct = (date: ISODate): number =>
    Math.min(100, Math.max(0, (diffDays(range.start, date) / totalDays) * 100));

  const monthLabels = range.weeks.filter((week, index) => {
    if (index === 0) return true;
    return week.slice(0, 7) !== range.weeks[index - 1].slice(0, 7);
  });

  const todayPct = pct(today);

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className="overflow-x-auto pb-2" data-testid="semester-timeline">
        <div className="min-w-[720px]">
          {/* Month labels + today marker */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="relative h-6 flex-1">
              {monthLabels.map((week) => (
                <span
                  key={week}
                  className="absolute top-0 text-[11px] font-semibold uppercase tracking-wider text-ink-faint"
                  style={{ left: `${pct(week)}%` }}
                >
                  {formatShort(week).split(" ")[0]}
                </span>
              ))}
              <span
                className="tnum absolute top-0 -translate-x-1/2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ left: `${todayPct}%` }}
              >
                Today
              </span>
            </div>
          </div>

          {/* Course lanes */}
          <div className="mt-1 rounded-lg border border-line bg-surface">
            {courses.map((course, laneIndex) => {
              const courseItems = deliverables.filter(
                (d) => d.courseId === course.id,
              );
              return (
                <div
                  key={course.id}
                  className={`flex items-stretch ${
                    laneIndex > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="flex w-24 shrink-0 items-center border-r border-line px-3 py-4">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
                      style={courseChipStyle(course.colorIndex)}
                    >
                      {course.name}
                    </span>
                  </div>
                  <div className="relative h-14 flex-1">
                    {range.weeks.map((week) => (
                      <span
                        key={week}
                        aria-hidden="true"
                        className="absolute inset-y-0 border-l border-line/60"
                        style={{ left: `${pct(week)}%` }}
                      />
                    ))}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 w-px bg-accent"
                      style={{ left: `${todayPct}%` }}
                    />
                    {courseItems.map((deliverable) => (
                      <TimelineEvent
                        key={deliverable.id}
                        deliverable={deliverable}
                        course={course}
                        courseDeliverables={courseItems}
                        leftPct={pct(deliverable.dueDate)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week axis */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            <div className="relative h-6 flex-1">
              {range.weeks
                .filter((_, index) => index % 2 === 0)
                .map((week) => (
                  <span
                    key={week}
                    className="tnum absolute top-1 text-[10px] text-ink-faint"
                    style={{ left: `${pct(week)}%` }}
                  >
                    {formatShort(week)}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
