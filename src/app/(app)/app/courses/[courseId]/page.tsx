"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GradePanel } from "@/components/grades/GradePanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { courseChipStyle } from "@/components/shared/course-colors";
import { formatLong } from "@/lib/dates/iso";
import { effectiveWeightPct } from "@/lib/grades/calc";
import { useAppStore } from "@/lib/store/useAppStore";

export default function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const course = useAppStore((state) => state.courses[courseId]);
  const deliverables = useAppStore((state) => state.deliverables);
  const setStatus = useAppStore((state) => state.setStatus);
  const updateDeliverable = useAppStore((state) => state.updateDeliverable);
  const removeCourse = useAppStore((state) => state.removeCourse);

  if (!course) {
    return (
      <EmptyState
        kicker="Course"
        headline="That course isn't here."
        body="It may have been removed, or the link is stale."
      >
        <Link
          href="/app"
          className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong"
        >
          Back to semester
        </Link>
      </EmptyState>
    );
  }

  const courseDeliverables = Object.values(deliverables)
    .filter((d) => d.courseId === course.id)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  const meetings = course.meetingTimes
    .map((meeting) => {
      const time =
        meeting.start && meeting.end ? ` ${meeting.start}–${meeting.end}` : "";
      return `${meeting.days.join("/")}${time} (${meeting.kind})`;
    })
    .join(" · ");

  function handleRemove() {
    if (window.confirm(`Remove ${course!.name} and all its deliverables?`)) {
      removeCourse(course!.id);
      router.push("/app");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link
        href="/app"
        className="text-sm text-ink-faint transition-colors duration-150 hover:text-accent"
      >
        ← Semester
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className="inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold"
            style={courseChipStyle(course.colorIndex)}
          >
            {course.name}
          </span>
          <h1 className="mt-2 font-display text-h1 text-ink">
            {course.title ?? course.name}
          </h1>
          {meetings ? (
            <p className="tnum mt-2 text-sm text-ink-soft">{meetings}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-faint transition-colors duration-150 hover:border-danger hover:text-danger"
        >
          Remove course
        </button>
      </header>

      <GradePanel course={course} courseDeliverables={courseDeliverables} />

      {course.grading.categories.length > 0 ? (
        <section aria-label="Grading scheme" className="mt-8">
          <h2 className="text-h2 font-display text-ink">Grading</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {course.grading.categories.map((category) => (
              <li
                key={category.id}
                className="tnum rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft"
              >
                {category.name}{" "}
                <span className="font-semibold text-ink">{category.weight}%</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Deliverables" className="mt-8">
        <h2 className="text-h2 font-display text-ink">Deliverables</h2>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
          {courseDeliverables.map((deliverable) => {
            const isDone = deliverable.status === "done";
            const weight = effectiveWeightPct(
              deliverable,
              course,
              courseDeliverables,
            );
            return (
              <li
                key={deliverable.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  aria-label={`Mark ${deliverable.title} as done`}
                  onChange={(event) =>
                    setStatus(
                      deliverable.id,
                      event.target.checked ? "done" : "pending",
                    )
                  }
                  className="h-4 w-4 accent-(--color-accent)"
                />
                <div className="min-w-0 flex-1 basis-48">
                  <p
                    className={`truncate text-sm ${
                      isDone ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    {deliverable.title}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {deliverable.type}
                    {weight > 0
                      ? ` · ${Math.round(weight * 10) / 10}% of grade`
                      : ""}
                  </p>
                </div>
                <p className="tnum shrink-0 text-sm text-ink-soft">
                  {formatLong(deliverable.dueDate)}
                </p>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0.5}
                    max={40}
                    step={0.5}
                    value={deliverable.estimatedHours}
                    aria-label={`Estimated hours for ${deliverable.title}`}
                    onChange={(event) =>
                      updateDeliverable(deliverable.id, {
                        estimatedHours: Number(event.target.value),
                      })
                    }
                    className="tnum w-14 rounded-sm border border-line bg-paper px-1.5 py-1 text-right text-xs text-ink focus:border-accent"
                  />
                  <span className="text-xs text-ink-faint">h</span>
                </div>
                {isDone ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={deliverable.score ?? ""}
                      placeholder="—"
                      aria-label={`Score for ${deliverable.title}`}
                      onChange={(event) =>
                        updateDeliverable(deliverable.id, {
                          score:
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                        })
                      }
                      className="tnum w-14 rounded-sm border border-line bg-paper px-1.5 py-1 text-right text-xs text-ink focus:border-accent"
                    />
                    <span className="text-xs text-ink-faint">/100</span>
                  </div>
                ) : null}
              </li>
            );
          })}
          {courseDeliverables.length === 0 ? (
            <li className="px-4 py-4 text-sm text-ink-faint">
              No deliverables recorded for this course.
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          Hours are estimates — tune them and the planner adjusts.
        </p>
      </section>
    </div>
  );
}
