import { describe, expect, test } from "vitest";

import {
  addDays,
  clampISO,
  compareISO,
  diffDays,
  eachDay,
  formatLong,
  formatShort,
  isValidISODate,
  maxISO,
  minISO,
  todayISO,
  weekdayOf,
  weekStartOf,
} from "./iso";

describe("isValidISODate", () => {
  test.each(["2026-08-08", "2028-02-29", "1999-12-31"])(
    "accepts real date %s",
    (iso) => {
      expect(isValidISODate(iso)).toBe(true);
    },
  );

  test.each([
    "2026-13-01", // month overflow
    "2026-02-30", // day overflow
    "2026-02-29", // 2026 is not a leap year
    "2026-8-8", // missing zero padding
    "08-08-2026", // wrong order
    "2026/08/08", // wrong separator
    "not-a-date",
    "",
  ])("rejects %s", (value) => {
    expect(isValidISODate(value)).toBe(false);
  });
});

describe("addDays", () => {
  test("adds within a month", () => {
    expect(addDays("2026-08-08", 5)).toBe("2026-08-13");
  });

  test("crosses month boundaries", () => {
    expect(addDays("2026-08-30", 3)).toBe("2026-09-02");
  });

  test("crosses year boundaries", () => {
    expect(addDays("2026-12-30", 4)).toBe("2027-01-03");
  });

  test("handles negative offsets", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  test("handles leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  test("throws on invalid input", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(/Invalid ISO date/);
  });
});

describe("diffDays", () => {
  test("is positive when b is later", () => {
    expect(diffDays("2026-08-08", "2026-08-15")).toBe(7);
  });

  test("is negative when b is earlier", () => {
    expect(diffDays("2026-08-08", "2026-08-01")).toBe(-7);
  });

  test("is zero for the same day", () => {
    expect(diffDays("2026-08-08", "2026-08-08")).toBe(0);
  });

  test("spans a year boundary", () => {
    expect(diffDays("2026-12-25", "2027-01-05")).toBe(11);
  });

  test("round-trips with addDays across DST transition dates", () => {
    // US DST changes: 2026-03-08 and 2026-11-01. UTC math must not care.
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(diffDays("2026-03-07", "2026-03-09")).toBe(2);
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(diffDays("2026-10-31", "2026-11-02")).toBe(2);
  });
});

describe("weekdayOf", () => {
  test.each([
    ["2026-08-08", "Sat"],
    ["2026-08-09", "Sun"],
    ["2026-08-10", "Mon"],
    ["2026-08-16", "Sun"],
    ["2026-01-01", "Thu"],
  ] as const)("%s is %s", (iso, expected) => {
    expect(weekdayOf(iso)).toBe(expected);
  });
});

describe("weekStartOf", () => {
  test("returns Monday for a mid-week date", () => {
    expect(weekStartOf("2026-08-13")).toBe("2026-08-10"); // Thu → Mon
  });

  test("returns the same day for a Monday", () => {
    expect(weekStartOf("2026-08-10")).toBe("2026-08-10");
  });

  test("Sunday belongs to the week started 6 days earlier", () => {
    expect(weekStartOf("2026-08-16")).toBe("2026-08-10");
  });
});

describe("eachDay", () => {
  test("is inclusive of both ends", () => {
    expect(eachDay("2026-08-08", "2026-08-10")).toEqual([
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
    ]);
  });

  test("single-day range", () => {
    expect(eachDay("2026-08-08", "2026-08-08")).toEqual(["2026-08-08"]);
  });

  test("empty when end precedes start", () => {
    expect(eachDay("2026-08-10", "2026-08-08")).toEqual([]);
  });
});

describe("comparison helpers", () => {
  test("compareISO orders correctly", () => {
    expect(compareISO("2026-08-08", "2026-08-09")).toBe(-1);
    expect(compareISO("2026-08-09", "2026-08-08")).toBe(1);
    expect(compareISO("2026-08-08", "2026-08-08")).toBe(0);
  });

  test("min/max/clamp", () => {
    expect(maxISO("2026-08-08", "2026-09-01")).toBe("2026-09-01");
    expect(minISO("2026-08-08", "2026-09-01")).toBe("2026-08-08");
    expect(clampISO("2026-07-01", "2026-08-01", "2026-09-01")).toBe(
      "2026-08-01",
    );
    expect(clampISO("2026-10-01", "2026-08-01", "2026-09-01")).toBe(
      "2026-09-01",
    );
    expect(clampISO("2026-08-15", "2026-08-01", "2026-09-01")).toBe(
      "2026-08-15",
    );
  });
});

describe("formatting", () => {
  test("formatShort", () => {
    expect(formatShort("2026-08-08")).toBe("Aug 8");
    expect(formatShort("2026-12-31")).toBe("Dec 31");
  });

  test("formatLong", () => {
    expect(formatLong("2026-08-08")).toBe("Sat, Aug 8");
  });
});

describe("todayISO", () => {
  test("returns a valid ISO date", () => {
    expect(isValidISODate(todayISO())).toBe(true);
  });
});
