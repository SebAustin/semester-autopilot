import { describe, expect, test } from "vitest";

import type { GradeModelItem } from "./whatif";
import {
  buildGradeModel,
  impactOfSkipping,
  neededOn,
  summarize,
} from "./whatif";
import type { Course, Deliverable } from "../types";

function item(overrides: Partial<GradeModelItem>): GradeModelItem {
  return {
    id: overrides.id ?? "x",
    title: overrides.title ?? overrides.id ?? "Item",
    weight: overrides.weight ?? 10,
    score: overrides.score === undefined ? null : overrides.score,
    ...overrides,
  };
}

describe("summarize", () => {
  test("current average covers only graded work", () => {
    const items = [
      item({ id: "a", weight: 40, score: 80 }),
      item({ id: "b", weight: 60, score: null }),
    ];
    const s = summarize(items);
    expect(s.currentAvg).toBe(80);
    expect(s.assumedScore).toBe(80);
    expect(s.projected).toBe(80);
  });

  test("overrides drive projection live", () => {
    const items = [
      item({ id: "a", weight: 40, score: 80 }),
      item({ id: "b", weight: 60, score: null }),
    ];
    const s = summarize(items, { b: 100 });
    expect(s.projected).toBe(92); // (80×40 + 100×60) / 100
  });

  test("no grades yet → assumes 100 baseline", () => {
    const items = [item({ id: "a", weight: 50 }), item({ id: "b", weight: 50 })];
    const s = summarize(items);
    expect(s.currentAvg).toBeNull();
    expect(s.assumedScore).toBe(100);
    expect(s.projected).toBe(100);
  });

  test("weights that do not sum to 100 are normalized", () => {
    const items = [
      item({ id: "a", weight: 45, score: 90 }),
      item({ id: "b", weight: 45, score: null }),
    ];
    const s = summarize(items);
    expect(s.projected).toBe(90);
  });

  test("zero total weight yields nulls, not NaN", () => {
    const s = summarize([item({ id: "a", weight: 0 })]);
    expect(s.projected).toBeNull();
    expect(s.currentAvg).toBeNull();
  });
});

describe("buildGradeModel scoring semantics", () => {
  const course: Course = {
    id: "c1",
    name: "CS",
    colorIndex: 1,
    meetingTimes: [],
    grading: { categories: [{ id: "cat", name: "Work", weight: 100 }] },
    source: "demo",
    createdAt: "2026-08-01T00:00:00.000Z",
  };

  function deliverable(overrides: Partial<Deliverable>): Deliverable {
    return {
      id: overrides.id ?? "d",
      courseId: "c1",
      title: "Item",
      type: "assignment",
      dueDate: "2026-09-01",
      categoryId: "cat",
      estimatedHours: 2,
      status: "pending",
      ...overrides,
    };
  }

  test("skipped counts as zero, done-without-score stays ungraded", () => {
    const items = buildGradeModel(course, [
      deliverable({ id: "skip", status: "skipped" }),
      deliverable({ id: "done-scored", status: "done", score: 88 }),
      deliverable({ id: "done-unscored", status: "done" }),
      deliverable({ id: "pending" }),
    ]);
    expect(items.find((i) => i.id === "skip")?.score).toBe(0);
    expect(items.find((i) => i.id === "done-scored")?.score).toBe(88);
    expect(items.find((i) => i.id === "done-unscored")?.score).toBeNull();
    expect(items.find((i) => i.id === "pending")?.score).toBeNull();
  });
});

describe("neededOn", () => {
  test("computes the classic needed-on-final number", () => {
    const items = [
      item({ id: "hw", weight: 50, score: 90 }),
      item({ id: "final", weight: 50, score: null }),
    ];
    expect(neededOn(items, "final", 90)).toEqual({ kind: "needed", pct: 90 });
  });

  test("already secured", () => {
    const items = [
      item({ id: "hw", weight: 80, score: 95 }),
      item({ id: "final", weight: 20, score: null }),
    ];
    expect(neededOn(items, "final", 60)).toEqual({ kind: "secured" });
  });

  test("not achievable", () => {
    const items = [
      item({ id: "hw", weight: 80, score: 50 }),
      item({ id: "final", weight: 20, score: null }),
    ];
    expect(neededOn(items, "final", 90)).toEqual({ kind: "not-achievable" });
  });

  test("other ungraded work is held at the current average", () => {
    const items = [
      item({ id: "hw", weight: 40, score: 80 }),
      item({ id: "essay", weight: 30, score: null }),
      item({ id: "final", weight: 30, score: null }),
    ];
    // earned 32; essay assumed 80 → 24; need 90×1.0=90 → final: (90−32−24)/0.3
    const result = neededOn(items, "final", 90);
    expect(result.kind).toBe("not-achievable"); // (34)/0.3 ≈ 113
  });

  test("unknown or zero-weight focus", () => {
    expect(neededOn([item({ id: "a", weight: 0 })], "a", 90)).toEqual({
      kind: "no-weight",
    });
    expect(neededOn([], "ghost", 90)).toEqual({ kind: "no-weight" });
  });
});

describe("impactOfSkipping", () => {
  test("reports the projected-grade drop", () => {
    const items = [
      item({ id: "a", weight: 40, score: 80 }),
      item({ id: "b", weight: 60, score: null }),
    ];
    // base 80 → skip b: (32 + 0) / 100 × 100 = 32 → −48
    expect(impactOfSkipping(items, "b")).toBe(-48);
  });

  test("null when the model is empty", () => {
    expect(impactOfSkipping([], "a")).toBeNull();
  });
});
