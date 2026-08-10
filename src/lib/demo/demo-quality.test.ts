import { describe, expect, test } from "vitest";

import { buildPlan } from "../scheduler/engine";
import { buildDemoData } from "./syllabi";

/**
 * The demo semester is the judge's first impression. Whatever weekday they
 * click "try demo data", the default plan must look SMART: a busy but
 * workable schedule with at most a couple of showcase conflicts — never a
 * wall of red.
 */

// 2026-08-10 is a Monday; +i walks one full week of possible "today"s.
const MONDAYS_WEEK = [
  "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13",
  "2026-08-14", "2026-08-15", "2026-08-16",
] as const;

const MAX_CONFLICTS = 3;

describe("demo data quality across judging weekdays", () => {
  for (const today of MONDAYS_WEEK) {
    test(`today=${today}: plan stays presentable`, () => {
      const demo = buildDemoData(today);
      const plan = buildPlan({
        deliverables: Object.values(demo.deliverables),
        courses: demo.courses,
        availability: demo.availability,
        today,
      });

      const impossible = plan.conflicts.filter(
        (c) => c.kind === "impossible-deadline",
      );
      expect
        .soft(
          plan.conflicts.length,
          `conflicts for ${today}: ${plan.conflicts.map((c) => c.message).join(" | ")}`,
        )
        .toBeLessThanOrEqual(MAX_CONFLICTS);
      expect(impossible.length).toBeLessThanOrEqual(2);
      // The plan is substantial (a real semester, not a toy)…
      expect(plan.stats.totalHours).toBeGreaterThan(40);
      // …and no overdue-pending items pollute the first screen.
      expect(
        plan.conflicts.some((c) => c.kind === "due-date-passed"),
      ).toBe(false);
    });
  }
});
