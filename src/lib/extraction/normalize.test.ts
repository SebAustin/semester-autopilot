import { describe, expect, test } from "vitest";

import type { ExtractionResult } from "./schema";
import {
  coerceISODate,
  coerceTimeHHMM,
  normalizeExtraction,
} from "./normalize";

const TODAY = "2026-08-09";

describe("coerceISODate", () => {
  test.each([
    // already ISO
    ["2026-10-12", "2026-10-12"],
    // slash forms
    ["10/12", "2026-10-12"],
    ["10/12/26", "2026-10-12"],
    ["10/12/2027", "2027-10-12"],
    ["9-4", "2026-09-04"],
    // month-name forms
    ["Oct 12", "2026-10-12"],
    ["October 12", "2026-10-12"],
    ["October 12, 2026", "2026-10-12"],
    ["Sept 4", "2026-09-04"],
    ["Thursday, September 24", "2026-09-24"],
    ["Fri Sep 4", "2026-09-04"],
    ["december 9th", "2026-12-09"],
    ["due Fri Sep 4", "2026-09-04"],
  ])("parses %s → %s", (input, expected) => {
    expect(coerceISODate(input, TODAY)).toBe(expected);
  });

  test.each([
    "TBD",
    "Week of Oct 12",
    "one week after each lab",
    "",
    "13/45",
    "Febtember 12",
  ])("returns null for unparseable %s", (input) => {
    expect(coerceISODate(input, TODAY)).toBeNull();
  });

  test("returns null for null/undefined", () => {
    expect(coerceISODate(null, TODAY)).toBeNull();
    expect(coerceISODate(undefined, TODAY)).toBeNull();
  });

  test("infers next year for dates far in the past (spring term seen in fall)", () => {
    expect(coerceISODate("Feb 2", "2026-11-20")).toBe("2027-02-02");
  });

  test("keeps current year within the grace window (recent past dates)", () => {
    expect(coerceISODate("Aug 1", "2026-08-09")).toBe("2026-08-01");
  });

  test("respects explicit years even when in the past", () => {
    expect(coerceISODate("March 1, 2024", TODAY)).toBe("2024-03-01");
  });
});

describe("coerceTimeHHMM", () => {
  test.each([
    ["7:30pm", "19:30"],
    ["7:30 PM", "19:30"],
    ["9am", "09:00"],
    ["12pm", "12:00"],
    ["12am", "00:00"],
    ["10:10", "10:10"],
    ["23:59", "23:59"],
  ])("parses %s → %s", (input, expected) => {
    expect(coerceTimeHHMM(input)).toBe(expected);
  });

  test.each(["noon", "25:00", "10:75", ""])("rejects %s", (input) => {
    expect(coerceTimeHHMM(input)).toBeNull();
  });

  test("passes through null", () => {
    expect(coerceTimeHHMM(null)).toBeNull();
  });
});

function baseResult(overrides: Partial<ExtractionResult>): ExtractionResult {
  return {
    courseName: "CS 3110",
    courseTitle: "Data Structures",
    meetingTimes: [],
    gradingCategories: [],
    deliverables: [],
    warnings: [],
    ...overrides,
  };
}

function deliverable(
  overrides: Partial<ExtractionResult["deliverables"][number]>,
): ExtractionResult["deliverables"][number] {
  return {
    title: "PS1",
    type: "assignment",
    dueDate: "2026-09-04",
    dueDateRaw: "due Fri Sep 4",
    weightPercent: null,
    confidence: "high",
    ...overrides,
  };
}

describe("normalizeExtraction", () => {
  test("sorts dated rows and buckets undated separately", () => {
    const result = normalizeExtraction(
      baseResult({
        deliverables: [
          deliverable({ title: "Late item", dueDate: "2026-12-01" }),
          deliverable({
            title: "Final exam",
            type: "exam",
            dueDate: null,
            dueDateRaw: "TBD",
            confidence: "low",
          }),
          deliverable({ title: "Early item", dueDate: "2026-09-01" }),
        ],
      }),
      TODAY,
    );

    expect(result.rows.map((row) => row.title)).toEqual([
      "Early item",
      "Late item",
    ]);
    expect(result.undated.map((row) => row.title)).toEqual(["Final exam"]);
  });

  test("rescues a parseable dueDateRaw when dueDate is null", () => {
    const result = normalizeExtraction(
      baseResult({
        deliverables: [
          deliverable({
            title: "Essay 1",
            dueDate: null,
            dueDateRaw: "Thursday, September 24",
            confidence: "low",
          }),
        ],
      }),
      TODAY,
    );

    expect(result.rows[0]?.dueDate).toBe("2026-09-24");
    expect(result.undated).toHaveLength(0);
  });

  test("dedupes rows with identical title and date", () => {
    const result = normalizeExtraction(
      baseResult({
        deliverables: [
          deliverable({}),
          deliverable({}),
          deliverable({ title: "  PS1  " }),
        ],
      }),
      TODAY,
    );

    expect(result.rows).toHaveLength(1);
  });

  test("applies effort defaults by type", () => {
    const result = normalizeExtraction(
      baseResult({
        deliverables: [
          deliverable({ title: "Midterm", type: "exam" }),
          deliverable({ title: "Reading 1", type: "reading" }),
        ],
      }),
      TODAY,
    );

    const byTitle = Object.fromEntries(
      result.rows.map((row) => [row.title, row.estimatedHours]),
    );
    expect(byTitle["Midterm"]).toBe(8);
    expect(byTitle["Reading 1"]).toBe(1.5);
  });

  test("warns when grading weights do not sum to ~100", () => {
    const result = normalizeExtraction(
      baseResult({
        gradingCategories: [
          { name: "Homework", weightPercent: 30 },
          { name: "Final", weightPercent: 40 },
        ],
      }),
      TODAY,
    );

    expect(result.warnings.some((w) => w.includes("70%"))).toBe(true);
  });

  test("accepts weights summing within the 95–105 window silently", () => {
    const result = normalizeExtraction(
      baseResult({
        gradingCategories: [
          { name: "Homework", weightPercent: 50 },
          { name: "Final", weightPercent: 52 },
        ],
      }),
      TODAY,
    );

    expect(result.warnings).toHaveLength(0);
  });

  test("clamps out-of-range weights", () => {
    const result = normalizeExtraction(
      baseResult({
        gradingCategories: [{ name: "Chaos", weightPercent: 140 }],
        deliverables: [deliverable({ weightPercent: -5 })],
      }),
      TODAY,
    );

    expect(result.grading[0]?.weight).toBe(100);
    expect(result.rows[0]?.weightPct).toBe(0);
  });

  test("coerces meeting times and drops day-less meetings", () => {
    const result = normalizeExtraction(
      baseResult({
        meetingTimes: [
          {
            days: ["Tue"],
            start: "2:55pm",
            end: "4:10pm",
            kind: "recitation",
            location: null,
          },
          { days: [], start: "9:00", end: null, kind: "other", location: null },
        ],
      }),
      TODAY,
    );

    expect(result.meetingTimes).toHaveLength(1);
    expect(result.meetingTimes[0]?.start).toBe("14:55");
    expect(result.meetingTimes[0]?.end).toBe("16:10");
  });

  test("drops rows with empty titles and trims fields", () => {
    const result = normalizeExtraction(
      baseResult({
        courseName: "  CS 3110  ",
        courseTitle: "   ",
        deliverables: [deliverable({ title: "   " })],
      }),
      TODAY,
    );

    expect(result.courseName).toBe("CS 3110");
    expect(result.courseTitle).toBeNull();
    expect(result.rows).toHaveLength(0);
  });
});
