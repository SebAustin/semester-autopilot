import { describe, expect, test } from "vitest";

import type { Course, Deliverable } from "../types";
import { buildICS, buildSemesterICS, icsStampFromISO } from "./build";
import { escapeText, foldLine } from "./escape";

const STAMP = "20260809T120000Z";

function makeEvent(overrides: Partial<Parameters<typeof buildICS>[0][number]>) {
  return {
    uid: "abc@semester-autopilot",
    date: "2026-10-12",
    title: "CS 3110: PS4",
    ...overrides,
  };
}

describe("escapeText", () => {
  test("escapes backslash, newline, semicolon, comma — in that order", () => {
    expect(escapeText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldLine", () => {
  test("leaves short lines untouched", () => {
    expect(foldLine("SUMMARY:short")).toBe("SUMMARY:short");
  });

  test("folds long lines at 75 octets with CRLF + space", () => {
    const long = "SUMMARY:" + "x".repeat(200);
    const folded = foldLine(long);
    for (const segment of folded.split("\r\n")) {
      expect(new TextEncoder().encode(segment).length).toBeLessThanOrEqual(75);
    }
    expect(folded.split("\r\n").slice(1).every((s) => s.startsWith(" "))).toBe(
      true,
    );
    // Unfolding restores the original exactly.
    expect(folded.replace(/\r\n /g, "")).toBe(long);
  });

  test("never splits a multi-byte character", () => {
    const long = "SUMMARY:" + "é".repeat(120);
    const folded = foldLine(long);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
    for (const segment of folded.split("\r\n")) {
      expect(segment.includes("�")).toBe(false);
      expect(new TextEncoder().encode(segment).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("buildICS", () => {
  test("produces a structurally valid calendar", () => {
    const ics = buildICS([makeEvent({})], STAMP);

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261012");
    expect(ics).toContain("DTEND;VALUE=DATE:20261013");
    expect(ics).toContain(`DTSTAMP:${STAMP}`);
    // CRLF discipline: no bare LF anywhere.
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  test("DTEND rolls over month boundaries", () => {
    const ics = buildICS([makeEvent({ date: "2026-10-31" })], STAMP);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261031");
    expect(ics).toContain("DTEND;VALUE=DATE:20261101");
  });

  test("every BEGIN:VEVENT is paired with END:VEVENT", () => {
    const ics = buildICS(
      [makeEvent({ uid: "a@x" }), makeEvent({ uid: "b@x", date: "2026-11-01" })],
      STAMP,
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(2);
  });

  test("escapes commas and semicolons in summaries", () => {
    const ics = buildICS(
      [makeEvent({ title: "Essay: history, memory; power" })],
      STAMP,
    );
    expect(ics).toContain("SUMMARY:Essay: history\\, memory\\; power");
  });
});

describe("buildSemesterICS", () => {
  const course: Course = {
    id: "c1",
    name: "CS 3110",
    colorIndex: 1,
    meetingTimes: [],
    grading: { categories: [] },
    source: "demo",
    createdAt: "2026-08-09T00:00:00.000Z",
  };
  const deliverable: Deliverable = {
    id: "d1",
    courseId: "c1",
    title: "Prelim 1",
    type: "exam",
    dueDate: "2026-10-08",
    weightPct: 15,
    estimatedHours: 8,
    status: "pending",
  };

  test("stable UIDs derived from deliverable ids", () => {
    const ics = buildSemesterICS({ c1: course }, { d1: deliverable }, STAMP);
    expect(ics).toContain("UID:d1@semester-autopilot");
    expect(ics).toContain("SUMMARY:CS 3110: Prelim 1");
    expect(ics).toContain("15% of grade");
  });

  test("events are sorted by date regardless of record order", () => {
    const later: Deliverable = { ...deliverable, id: "d2", dueDate: "2026-12-01" };
    const ics = buildSemesterICS(
      { c1: course },
      { d2: later, d1: deliverable },
      STAMP,
    );
    expect(ics.indexOf("20261008")).toBeLessThan(ics.indexOf("20261201"));
  });
});

describe("icsStampFromISO", () => {
  test("converts an ISO datetime to ICS basic format", () => {
    expect(icsStampFromISO("2026-08-09T13:05:00.123Z")).toBe("20260809T130500Z");
  });
});
