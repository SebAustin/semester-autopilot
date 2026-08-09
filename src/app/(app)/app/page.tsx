"use client";

import { useMemo } from "react";
import Link from "next/link";

import { DemoDataButton } from "@/components/shared/DemoDataButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { courseChipStyle } from "@/components/shared/course-colors";
import { IcsExportButton } from "@/components/timeline/IcsExportButton";
import { SemesterTimeline } from "@/components/timeline/SemesterTimeline";
import { WorkloadHeatmap } from "@/components/timeline/WorkloadHeatmap";
import { formatLong, todayISO } from "@/lib/dates/iso";
import { useAppStore } from "@/lib/store/useAppStore";
import { computeTimelineRange } from "@/lib/timeline-range";
import type { Deliverable } from "@/lib/types";

const UPCOMING_LIMIT = 6;

function upcoming(
  deliverables: Record<string, Deliverable>,
  today: string,
): Deliverable[] {
  return Object.values(deliverables)
    .filter((d) => d.status === "pending" && d.dueDate >= today)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, UPCOMING_LIMIT);
}

export default function SemesterPage() {
  const courses = useAppStore((state) => state.courses);
  const deliverables = useAppStore((state) => state.deliverables);
  const semester = useAppStore((state) => state.semester);

  const courseList = Object.values(courses);
  const deliverableList = useMemo(
    () => Object.values(deliverables),
    [deliverables],
  );
  const today = todayISO();
  const range = useMemo(
    () => computeTimelineRange(deliverableList, semester, today),
    [deliverableList, semester, today],
  );

  if (courseList.length === 0) {
    return (
      <EmptyState
        kicker="Welcome"
        headline="Nothing on the radar yet."
        body="Add a course from a syllabus PDF, or load the demo semester to see Autopilot working in ten seconds."
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

  const nextUp = upcoming(deliverables, today);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-h1 text-ink">This semester</h1>
        <IcsExportButton />
      </div>

      <section aria-label="Semester timeline" className="mt-8">
        <SemesterTimeline
          courses={courseList}
          deliverables={deliverableList}
          range={range}
        />
        <WorkloadHeatmap deliverables={deliverableList} weeks={range.weeks} />
      </section>

      <section aria-label="Courses" className="mt-12">
        <h2 className="text-h2 font-display text-ink">Courses</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courseList.map((course) => {
            const count = deliverableList.filter(
              (d) => d.courseId === course.id && d.status === "pending",
            ).length;
            return (
              <Link
                key={course.id}
                href={`/app/courses/${course.id}`}
                className="group rounded-lg border border-line bg-surface p-5 transition-colors duration-150 hover:border-accent"
              >
                <span
                  className="inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold"
                  style={courseChipStyle(course.colorIndex)}
                >
                  {course.name}
                </span>
                <h3 className="mt-3 text-base font-medium text-ink group-hover:text-accent-strong">
                  {course.title ?? course.name}
                </h3>
                <p className="tnum mt-2 text-sm text-ink-faint">
                  {count} open deliverable{count === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Next deadlines" className="mt-12">
        <h2 className="text-h2 font-display text-ink">Next up</h2>
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
          {nextUp.map((deliverable) => {
            const course = courses[deliverable.courseId];
            return (
              <li
                key={deliverable.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {course ? (
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
                      style={courseChipStyle(course.colorIndex)}
                    >
                      {course.name}
                    </span>
                  ) : null}
                  <p className="truncate text-sm text-ink">{deliverable.title}</p>
                </div>
                <p className="tnum shrink-0 text-sm text-ink-soft">
                  {formatLong(deliverable.dueDate)}
                </p>
              </li>
            );
          })}
          {nextUp.length === 0 ? (
            <li className="px-5 py-6 text-sm text-ink-faint">
              Nothing due — enjoy the calm.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
