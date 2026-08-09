import { describe, expect, test } from "vitest";

import { addDays, maxISO } from "../dates/iso";
import type {
  Course,
  Deliverable,
  DeliverableType,
  UserAvailability,
  Weekday,
} from "../types";
import { WEEKDAYS } from "../types";
import { DEFAULT_SCHEDULER_CONFIG } from "./config";
import { buildPlan, type BuildPlanInput } from "./engine";

const TODAY = "2026-08-10";
const SCENARIOS = 100;

/** mulberry32 — tiny deterministic PRNG; Math.random is banned here. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TYPES: DeliverableType[] = [
  "assignment", "quiz", "exam", "project", "reading", "paper", "presentation", "other",
];

function generateScenario(seed: number): BuildPlanInput {
  const rnd = mulberry32(seed);
  const int = (max: number) => Math.floor(rnd() * max);

  const courseCount = 1 + int(4);
  const courses: Record<string, Course> = {};
  for (let c = 0; c < courseCount; c += 1) {
    const id = `course-${c}`;
    courses[id] = {
      id,
      name: `C${c}`,
      colorIndex: ((c % 6) + 1) as Course["colorIndex"],
      meetingTimes: [],
      grading: {
        categories:
          rnd() < 0.7
            ? [
                { id: `${id}-a`, name: "Work", weight: 40 + int(30) },
                { id: `${id}-b`, name: "Exams", weight: 30 + int(30) },
              ]
            : [],
      },
      source: "demo",
      createdAt: "2026-08-01T00:00:00.000Z",
    };
  }

  const deliverableCount = 3 + int(23);
  const deliverables: Deliverable[] = [];
  for (let d = 0; d < deliverableCount; d += 1) {
    const courseId = `course-${int(courseCount)}`;
    const course = courses[courseId];
    const category =
      course.grading.categories.length > 0 && rnd() < 0.8
        ? course.grading.categories[int(course.grading.categories.length)]
        : undefined;
    deliverables.push({
      id: `d-${d}`,
      courseId,
      title: `Item ${d}`,
      type: TYPES[int(TYPES.length)],
      dueDate: addDays(TODAY, int(46) - 3), // some overdue
      categoryId: category?.id,
      weightPct: rnd() < 0.2 ? int(30) : undefined,
      estimatedHours: (1 + int(23)) * 0.5, // 0.5..12h
      status: rnd() < 0.15 ? "done" : rnd() < 0.05 ? "skipped" : "pending",
    });
  }

  const weeklyHours = {} as Record<Weekday, number>;
  for (const day of WEEKDAYS) weeklyHours[day] = int(11) * 0.5; // 0..5h
  const blackoutDates = Array.from({ length: int(7) }, () =>
    addDays(TODAY, int(30)),
  );
  const availability: UserAvailability = { weeklyHours, blackoutDates };

  return { deliverables, courses, availability, today: TODAY };
}

describe(`scheduler fuzz — ${SCENARIOS} seeded scenarios`, () => {
  for (let seed = 1; seed <= SCENARIOS; seed += 1) {
    test(`seed ${seed}: all invariants hold`, () => {
      const input = generateScenario(seed);
      const plan = buildPlan(input);
      const config = DEFAULT_SCHEDULER_CONFIG;
      const blackouts = new Set(input.availability.blackoutDates);
      const byId = new Map(input.deliverables.map((d) => [d.id, d]));

      // 1. Granularity: every block is a positive multiple of 0.5h.
      for (const block of plan.blocks) {
        expect(block.hours).toBeGreaterThan(0);
        expect((block.hours * 2) % 1).toBe(0);
      }

      // 2. No day exceeds capacity; blackout days carry nothing.
      const dayTotals = new Map<string, number>();
      for (const block of plan.blocks) {
        dayTotals.set(block.date, (dayTotals.get(block.date) ?? 0) + block.hours);
      }
      for (const [date, hours] of dayTotals) {
        expect(blackouts.has(date)).toBe(false);
        const weekday = WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7];
        expect(hours).toBeLessThanOrEqual(
          input.availability.weeklyHours[weekday],
        );
      }

      // 3. Per-task/per-day caps and [release, deadline] windows.
      const perTaskDay = new Map<string, number>();
      for (const block of plan.blocks) {
        const d = byId.get(block.deliverableId)!;
        const release = maxISO(
          TODAY,
          addDays(d.dueDate, -config.startWindowDays[d.type]),
        );
        expect(block.date >= release).toBe(true);
        expect(block.date <= d.dueDate).toBe(true);
        const key = `${block.deliverableId}|${block.date}`;
        perTaskDay.set(key, (perTaskDay.get(key) ?? 0) + block.hours * 2);
        expect(perTaskDay.get(key)!).toBeLessThanOrEqual(
          config.perDayCapHalfHours[d.type],
        );
      }

      // 4. Conservation: placed + shortfall = estimate for every schedulable task.
      const placed = new Map<string, number>();
      for (const block of plan.blocks) {
        placed.set(
          block.deliverableId,
          (placed.get(block.deliverableId) ?? 0) + block.hours,
        );
      }
      const shortfalls = new Map<string, number>();
      for (const conflict of plan.conflicts) {
        if (conflict.kind === "impossible-deadline") {
          shortfalls.set(conflict.deliverableIds[0], conflict.shortfallHours ?? 0);
        }
      }
      for (const d of input.deliverables) {
        if (d.status !== "pending" || d.dueDate < TODAY || d.estimatedHours <= 0)
          continue;
        const expected = Math.round(d.estimatedHours * 2) / 2;
        const got = (placed.get(d.id) ?? 0) + (shortfalls.get(d.id) ?? 0);
        expect(got).toBe(expected);
      }

      // 5. Non-pending and overdue items never receive blocks.
      for (const block of plan.blocks) {
        const d = byId.get(block.deliverableId)!;
        expect(d.status).toBe("pending");
        expect(d.dueDate >= TODAY).toBe(true);
      }

      // 6. Determinism: byte-identical rerun.
      expect(JSON.stringify(buildPlan(input))).toBe(JSON.stringify(plan));
    });
  }
});
