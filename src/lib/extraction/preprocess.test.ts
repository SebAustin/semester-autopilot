import { describe, expect, test } from "vitest";

import { MAX_EXTRACTION_CHARS, preprocessSyllabus } from "./preprocess";

describe("preprocessSyllabus", () => {
  test("normalizes whitespace but keeps content under the cap intact", () => {
    const input = "CS 3110\r\n\r\n\r\n\r\nPS1  due Fri Sep 4   \nGrading: 30%";
    expect(preprocessSyllabus(input)).toBe(
      "CS 3110\n\nPS1  due Fri Sep 4\nGrading: 30%",
    );
  });

  test("strips NUL characters from PDF extraction artifacts", () => {
    expect(preprocessSyllabus("PS1\u0000 due Sep 4")).toBe("PS1 due Sep 4");
  });

  test("keeps deadline lines and drops filler when over the cap", () => {
    const filler = Array.from(
      { length: 3000 },
      (_, i) =>
        `This paragraph number ${i} discusses classroom philosophy at considerable and unnecessary length without concrete information.`,
    );
    const signal = "Prelim 1: Thursday, October 8, 7:30pm — worth 15%";
    const input = [...filler.slice(0, 1500), signal, ...filler.slice(1500)].join(
      "\n",
    );

    const output = preprocessSyllabus(input);
    expect(input.length).toBeGreaterThan(MAX_EXTRACTION_CHARS);
    expect(output.length).toBeLessThanOrEqual(MAX_EXTRACTION_CHARS + 200);
    expect(output).toContain(signal);
    expect(output).not.toContain("paragraph number 2999");
  });

  test("keeps short header lines when filtering", () => {
    const filler = Array.from(
      { length: 3000 },
      () =>
        "A very long sentence about attendance philosophy that carries no dates and no percentages whatsoever, repeated to pad the document.",
    ).join("\n");
    const input = `GRADING BREAKDOWN\n${filler}`;

    expect(preprocessSyllabus(input)).toContain("GRADING BREAKDOWN");
  });
});
