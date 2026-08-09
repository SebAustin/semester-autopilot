import { describe, expect, test } from "vitest";

import type { Course, Deliverable, UserAvailability } from "../types";
import { buildPlan, type BuildPlanInput } from "./engine";

const TODAY = "2026-08-10"; // a Monday

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: "c1",
    name: "CS 3110",
    colorIndex: 1,
    meetingTimes: [],
    grading: { categories: [] },
    source: "demo",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function deliverable(overrides: Partial<Deliverable>): Deliverable {
  return {
    id: overrides.id ?? "d1",
    courseId: "c1",
    title: overrides.title ?? overrides.id ?? "Item",
    type: "assignment",
    dueDate: "2026-08-17",
    estimatedHours: 3,
    status: "pending",
    ...overrides,
  };
}

function availability(
  hours: number,
  overrides: Partial<UserAvailability> = {},
): UserAvailability {
  return {
    weeklyHours: {
      Mon: hours, Tue: hours, Wed: hours, Thu: hours,
      Fri: hours, Sat: hours, Sun: hours,
    },
    blackoutDates: [],
    ...overrides,
  };
}

function input(overrides: Partial<BuildPlanInput>): BuildPlanInput {
  return {
    deliverables: [deliverable({})],
    courses: { c1: course() },
    availability: availability(2),
    today: TODAY,
    ...overrides,
  };
}

function hoursPlaced(plan: ReturnType<typeof buildPlan>, id: string): number {
  return plan.blocks
    .filter((b) => b.deliverableId === id)
    .reduce((acc, b) => acc + b.hours, 0);
}

describe("buildPlan — basics", () => {
  test("packs all hours when capacity suffices", () => {
    const plan = buildPlan(input({}));
    expect(hoursPlaced(plan, "d1")).toBe(3);
    expect(plan.conflicts).toHaveLength(0);
  });

  test("blocks stay within [release, deadline]", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", type: "assignment", dueDate: "2026-09-10" }),
        ],
      }),
    );
    // assignment window = 7 days → release 2026-09-03
    for (const block of plan.blocks) {
      expect(block.date >= "2026-09-03").toBe(true);
      expect(block.date <= "2026-09-10").toBe(true);
    }
  });

  test("release is clamped to today for near deadlines", () => {
    const plan = buildPlan(
      input({
        deliverables: [deliverable({ id: "d1", dueDate: "2026-08-12" })],
      }),
    );
    expect(plan.blocks.every((b) => b.date >= TODAY)).toBe(true);
    expect(hoursPlaced(plan, "d1")).toBe(3);
  });

  test("respects per-day caps by type (assignment ≤2h/day)", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", estimatedHours: 6, dueDate: "2026-08-20" }),
        ],
        availability: availability(8),
      }),
    );
    const byDate = new Map<string, number>();
    for (const b of plan.blocks) {
      byDate.set(b.date, (byDate.get(b.date) ?? 0) + b.hours);
    }
    expect(Math.max(...byDate.values())).toBeLessThanOrEqual(2);
    expect(hoursPlaced(plan, "d1")).toBe(6);
  });

  test("half-hour estimates are preserved exactly", () => {
    const plan = buildPlan(
      input({
        deliverables: [deliverable({ id: "d1", estimatedHours: 2.5 })],
      }),
    );
    expect(hoursPlaced(plan, "d1")).toBe(2.5);
    expect(plan.blocks.every((b) => (b.hours * 2) % 1 === 0)).toBe(true);
  });

  test("zero-estimate items produce no blocks and no conflicts", () => {
    const plan = buildPlan(
      input({
        deliverables: [deliverable({ id: "d1", estimatedHours: 0 })],
      }),
    );
    expect(plan.blocks).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(0);
  });

  test("done and skipped items are excluded, freeing capacity", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "big", estimatedHours: 8, dueDate: "2026-08-14", status: "done" }),
          deliverable({ id: "d1", estimatedHours: 3, dueDate: "2026-08-14" }),
        ],
        availability: availability(1),
      }),
    );
    expect(hoursPlaced(plan, "big")).toBe(0);
    expect(hoursPlaced(plan, "d1")).toBe(3);
    expect(plan.conflicts).toHaveLength(0);
  });
});

describe("buildPlan — priority behavior", () => {
  test("earlier deadline wins scarce capacity", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "late", dueDate: "2026-08-30", estimatedHours: 2 }),
          deliverable({ id: "soon", dueDate: "2026-08-11", estimatedHours: 2 }),
        ],
        availability: availability(1),
      }),
    );
    const soonBlocks = plan.blocks.filter((b) => b.deliverableId === "soon");
    expect(soonBlocks.length).toBeGreaterThan(0);
    expect(hoursPlaced(plan, "soon")).toBe(2);
    // "soon" owns the first days
    const firstDates = plan.blocks
      .filter((b) => b.date <= "2026-08-11")
      .map((b) => b.deliverableId);
    expect(new Set(firstDates)).toEqual(new Set(["soon"]));
  });

  test("higher grade weight wins when urgency ties", () => {
    const c = course({
      grading: {
        categories: [{ id: "cat", name: "Exams", weight: 40 }],
      },
    });
    const plan = buildPlan(
      input({
        courses: { c1: c },
        deliverables: [
          deliverable({ id: "light", dueDate: "2026-08-12", estimatedHours: 2 }),
          deliverable({
            id: "heavy",
            dueDate: "2026-08-12",
            estimatedHours: 2,
            type: "exam",
            weightPct: 40,
          }),
        ],
        availability: availability(1),
      }),
    );
    // Only ~3h available before the deadline; the 40% exam must be fully placed.
    expect(hoursPlaced(plan, "heavy")).toBe(2);
  });

  test("deterministic tie-break: identical tasks resolve by id", () => {
    const twins = [
      deliverable({ id: "b-task", dueDate: "2026-08-12", estimatedHours: 2 }),
      deliverable({ id: "a-task", dueDate: "2026-08-12", estimatedHours: 2 }),
    ];
    const planA = buildPlan(input({ deliverables: twins, availability: availability(1) }));
    const planB = buildPlan(
      input({ deliverables: [...twins].reverse(), availability: availability(1) }),
    );
    expect(JSON.stringify(planA)).toBe(JSON.stringify(planB));
  });

  test("two runs are byte-identical", () => {
    const config = input({
      deliverables: [
        deliverable({ id: "d1", dueDate: "2026-08-20" }),
        deliverable({ id: "d2", dueDate: "2026-08-15", type: "exam", estimatedHours: 8 }),
        deliverable({ id: "d3", dueDate: "2026-09-01", type: "project", estimatedHours: 10 }),
      ],
    });
    expect(JSON.stringify(buildPlan(config))).toBe(
      JSON.stringify(buildPlan(config)),
    );
  });
});

describe("buildPlan — blackouts and conflicts", () => {
  test("blackout day gets no blocks and hours reflow", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", dueDate: "2026-08-14", estimatedHours: 4 }),
        ],
        availability: availability(2, { blackoutDates: ["2026-08-12"] }),
      }),
    );
    expect(plan.blocks.some((b) => b.date === "2026-08-12")).toBe(false);
    expect(hoursPlaced(plan, "d1")).toBe(4);
  });

  test("blackout on the due date itself still packs earlier days", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", dueDate: "2026-08-13", estimatedHours: 4 }),
        ],
        availability: availability(2, { blackoutDates: ["2026-08-13"] }),
      }),
    );
    expect(hoursPlaced(plan, "d1")).toBe(4);
    expect(plan.blocks.every((b) => b.date < "2026-08-13")).toBe(true);
  });

  test("overdue pending items are flagged and never scheduled in the past", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "old", dueDate: "2026-08-01", title: "Old essay" }),
        ],
      }),
    );
    expect(plan.blocks).toHaveLength(0);
    const conflict = plan.conflicts.find((c) => c.kind === "due-date-passed");
    expect(conflict).toBeDefined();
    expect(conflict?.deliverableIds).toEqual(["old"]);
    expect(conflict?.message).toContain("Old essay");
  });

  test("impossible deadline reports the exact shortfall", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", dueDate: "2026-08-12", estimatedHours: 10, title: "Monster PS" }),
        ],
        availability: availability(1),
      }),
    );
    // 3 days × 1h available, capped at 2h/day → 3h placed, 7h short
    const conflict = plan.conflicts.find((c) => c.kind === "impossible-deadline");
    expect(conflict?.shortfallHours).toBe(7);
    expect(conflict?.message).toContain("Monster PS");
    expect(hoursPlaced(plan, "d1")).toBe(3);
  });

  test("overcommitted weeks aggregate shortfalls by deadline week", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "a", dueDate: "2026-08-12", estimatedHours: 8 }),
          deliverable({ id: "b", dueDate: "2026-08-13", estimatedHours: 8 }),
        ],
        availability: availability(0.5),
      }),
    );
    const weekly = plan.conflicts.filter((c) => c.kind === "overcommitted-week");
    expect(weekly).toHaveLength(1);
    expect(weekly[0].weekStart).toBe("2026-08-10");
    expect(weekly[0].shortfallHours).toBeGreaterThan(0);
    expect(weekly[0].deliverableIds.sort()).toEqual(["a", "b"]);
  });

  test("all-zero availability conflicts everything, places nothing", () => {
    const plan = buildPlan(
      input({
        deliverables: [deliverable({ id: "d1" })],
        availability: availability(0),
      }),
    );
    expect(plan.blocks).toHaveLength(0);
    expect(
      plan.conflicts.some((c) => c.kind === "impossible-deadline"),
    ).toBe(true);
  });

  test("due today with zero capacity today conflicts", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", dueDate: TODAY, estimatedHours: 2 }),
        ],
        availability: availability(0),
      }),
    );
    expect(plan.blocks).toHaveLength(0);
    expect(plan.conflicts.some((c) => c.kind === "impossible-deadline")).toBe(true);
  });
});

describe("buildPlan — output shape", () => {
  test("block keys are stable and chronological per deliverable", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", estimatedHours: 6, dueDate: "2026-08-20" }),
        ],
      }),
    );
    const keys = plan.blocks
      .filter((b) => b.deliverableId === "d1")
      .map((b) => b.key);
    expect(keys).toEqual(keys.map((_, i) => `d1#${i}`));
  });

  test("horizon extends past the minimum for far deadlines", () => {
    const plan = buildPlan(
      input({
        deliverables: [deliverable({ id: "d1", dueDate: "2026-11-20" })],
      }),
    );
    expect(plan.horizon.end >= "2026-11-20").toBe(true);
  });

  test("stats aggregate totals and per-week hours", () => {
    const plan = buildPlan(
      input({
        deliverables: [
          deliverable({ id: "d1", estimatedHours: 4, dueDate: "2026-08-14" }),
        ],
      }),
    );
    expect(plan.stats.totalHours).toBe(4);
    const weekSum = Object.values(plan.stats.byWeek).reduce((a, b) => a + b, 0);
    expect(weekSum).toBe(4);
    expect(Object.keys(plan.stats.byWeek)).toEqual(["2026-08-10"]);
  });
});
