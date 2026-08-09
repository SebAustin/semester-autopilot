import { describe, expect, test } from "vitest";

import type { Deliverable } from "./types";
import { dueHoursByWeek } from "./workload";

function make(overrides: Partial<Deliverable>): Deliverable {
  return {
    id: Math.random().toString(36).slice(2),
    courseId: "c1",
    title: "Item",
    type: "assignment",
    dueDate: "2026-08-12",
    estimatedHours: 3,
    status: "pending",
    ...overrides,
  };
}

describe("dueHoursByWeek", () => {
  test("groups same-week items under the Monday key", () => {
    // 2026-08-12 is a Wednesday; its week starts Monday 2026-08-10.
    const result = dueHoursByWeek([
      make({ dueDate: "2026-08-12", estimatedHours: 3 }),
      make({ dueDate: "2026-08-14", estimatedHours: 2 }),
    ]);
    expect(result["2026-08-10"]).toBe(5);
  });

  test("separates different weeks", () => {
    const result = dueHoursByWeek([
      make({ dueDate: "2026-08-12" }),
      make({ dueDate: "2026-08-19" }),
    ]);
    expect(Object.keys(result).sort()).toEqual(["2026-08-10", "2026-08-17"]);
  });

  test("excludes skipped items but counts done ones", () => {
    const result = dueHoursByWeek([
      make({ dueDate: "2026-08-12", status: "skipped", estimatedHours: 8 }),
      make({ dueDate: "2026-08-12", status: "done", estimatedHours: 2 }),
    ]);
    expect(result["2026-08-10"]).toBe(2);
  });
});
