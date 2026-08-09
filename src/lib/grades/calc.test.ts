import { describe, expect, test } from "vitest";

import type { Course, Deliverable } from "../types";
import { effectiveWeightPct } from "./calc";
import { matchCategoryName } from "./match";

function makeCourse(): Course {
  return {
    id: "c1",
    name: "CS 3110",
    colorIndex: 1,
    meetingTimes: [],
    grading: {
      categories: [
        { id: "cat-hw", name: "Problem Sets", weight: 30 },
        { id: "cat-final", name: "Final Exam", weight: 25 },
      ],
    },
    source: "demo",
    createdAt: "2026-08-09T00:00:00.000Z",
  };
}

function makeDeliverable(overrides: Partial<Deliverable>): Deliverable {
  return {
    id: "d1",
    courseId: "c1",
    title: "PS1",
    type: "assignment",
    dueDate: "2026-09-04",
    estimatedHours: 3,
    status: "pending",
    ...overrides,
  };
}

describe("effectiveWeightPct", () => {
  test("explicit weight wins over category derivation", () => {
    const course = makeCourse();
    const d = makeDeliverable({ weightPct: 15, categoryId: "cat-hw" });
    expect(effectiveWeightPct(d, course, [d])).toBe(15);
  });

  test("derives category weight split across category items", () => {
    const course = makeCourse();
    const ps1 = makeDeliverable({ id: "a", categoryId: "cat-hw" });
    const ps2 = makeDeliverable({ id: "b", categoryId: "cat-hw" });
    const ps3 = makeDeliverable({ id: "c", categoryId: "cat-hw" });
    const all = [ps1, ps2, ps3];
    expect(effectiveWeightPct(ps1, course, all)).toBe(10);
  });

  test("single-item category carries the full weight", () => {
    const course = makeCourse();
    const final = makeDeliverable({ id: "f", type: "exam", categoryId: "cat-final" });
    expect(effectiveWeightPct(final, course, [final])).toBe(25);
  });

  test("returns 0 when nothing is known — never invents a weight", () => {
    const course = makeCourse();
    const mystery = makeDeliverable({});
    expect(effectiveWeightPct(mystery, course, [mystery])).toBe(0);
  });

  test("returns 0 for a dangling categoryId", () => {
    const course = makeCourse();
    const orphan = makeDeliverable({ categoryId: "gone" });
    expect(effectiveWeightPct(orphan, course, [orphan])).toBe(0);
  });
});

describe("matchCategoryName", () => {
  const CS_CATEGORIES = [
    "Problem Sets",
    "Prelim 1",
    "Prelim 2",
    "Final Exam",
    "Programming Project",
    "Participation",
  ];

  test("PS-series titles map to Problem Sets", () => {
    expect(matchCategoryName("PS1", "assignment", CS_CATEGORIES)).toBe(
      "Problem Sets",
    );
    expect(matchCategoryName("PS6", "assignment", CS_CATEGORIES)).toBe(
      "Problem Sets",
    );
  });

  test("exact phrase beats sibling categories", () => {
    expect(matchCategoryName("Prelim 1", "exam", CS_CATEGORIES)).toBe("Prelim 1");
    expect(matchCategoryName("Prelim 2", "exam", CS_CATEGORIES)).toBe("Prelim 2");
  });

  test("final exam maps by phrase and type", () => {
    expect(matchCategoryName("Final Exam", "exam", CS_CATEGORIES)).toBe(
      "Final Exam",
    );
  });

  test("projects map to the project category", () => {
    expect(
      matchCategoryName("Final project", "project", CS_CATEGORIES),
    ).toBe("Programming Project");
  });

  test("essays map to essay-ish categories", () => {
    expect(
      matchCategoryName("Essay 1", "paper", ["Participation", "Short Essays", "Research Paper"]),
    ).toBe("Short Essays");
  });

  test("lab reports map to Laboratory via prefix overlap", () => {
    expect(
      matchCategoryName("Lab report 3", "assignment", ["Laboratory", "Weekly quizzes"]),
    ).toBe("Laboratory");
  });

  test("returns undefined below threshold — no wild guesses", () => {
    expect(
      matchCategoryName("Mystery item", "other", CS_CATEGORIES),
    ).toBeUndefined();
  });
});
