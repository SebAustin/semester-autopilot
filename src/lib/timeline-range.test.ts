import { describe, expect, test } from "vitest";

import { computeTimelineRange } from "./timeline-range";
import type { Deliverable } from "./types";

const TODAY = "2026-08-09";

function make(dueDate: string): Deliverable {
  return {
    id: dueDate,
    courseId: "c1",
    title: "Item",
    type: "assignment",
    dueDate,
    estimatedHours: 3,
    status: "pending",
  };
}

describe("computeTimelineRange", () => {
  test("uses semester bounds when provided, snapped to a Monday start", () => {
    const range = computeTimelineRange(
      [make("2026-09-01")],
      { startDate: "2026-08-05", endDate: "2026-11-20" },
      TODAY,
    );
    expect(range.start).toBe("2026-08-03"); // Monday of Aug 5's week
    expect(range.end).toBe("2026-11-20");
    expect(range.weeks[0]).toBe("2026-08-03");
    expect(range.weeks.every((w, i, arr) => i === 0 || w > arr[i - 1])).toBe(true);
  });

  test("derives padded bounds from deliverables when no semester is set", () => {
    const range = computeTimelineRange(
      [make("2026-08-20"), make("2026-10-10")],
      null,
      TODAY,
    );
    expect(range.start <= "2026-08-13").toBe(true);
    expect(range.end >= "2026-10-17").toBe(true);
  });

  test("always includes today even when all work is in the future", () => {
    const range = computeTimelineRange([make("2026-10-01")], null, TODAY);
    expect(range.start <= TODAY).toBe(true);
  });

  test("enforces a minimum span for near-empty semesters", () => {
    const range = computeTimelineRange([make("2026-08-10")], null, TODAY);
    expect(range.weeks.length).toBeGreaterThanOrEqual(4);
  });
});
