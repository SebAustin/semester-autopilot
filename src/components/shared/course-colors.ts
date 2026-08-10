import type { CSSProperties } from "react";

import type { CourseColorIndex } from "@/lib/types";

/** Inline style hooks for the 6 course identity hues defined in globals.css. */
export function courseChipStyle(index: CourseColorIndex): CSSProperties {
  return {
    backgroundColor: `var(--color-course-${index}-soft)`,
    color: `var(--color-course-${index}-text)`,
  };
}

export function courseAccentStyle(index: CourseColorIndex): CSSProperties {
  return { backgroundColor: `var(--color-course-${index})` };
}
