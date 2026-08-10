"use client";

import { motion } from "motion/react";

import { courseChipStyle } from "@/components/shared/course-colors";
import type { Course, Deliverable, StudyBlock } from "@/lib/types";

type Props = {
  block: StudyBlock;
  course: Course;
  deliverable: Deliverable;
};

/**
 * Reroute motion = within-day `layout` reflow + enter/exit crossfade + the
 * day-column pulse. Deliberately NOT shared-element (`layoutId`) transitions:
 * mass plan swaps (demo refresh, availability changes) left cross-cell
 * projections stranded mid-flight. The crossfade is the plan's sanctioned
 * fallback — robust under any swap size.
 */
export function StudyBlockCard({ block, course, deliverable }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      data-testid="study-block"
      className="rounded-sm border border-line/70 bg-paper px-2 py-1.5"
      style={{
        borderLeft: `3px solid var(--color-course-${course.colorIndex})`,
      }}
    >
      <p className="truncate text-xs text-ink" title={deliverable.title}>
        {deliverable.title}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span
          className="rounded-[3px] px-1 text-[9px] font-semibold"
          style={courseChipStyle(course.colorIndex)}
        >
          {course.name}
        </span>
        <span className="tnum text-[10px] text-ink-faint">{block.hours}h</span>
      </div>
    </motion.div>
  );
}
