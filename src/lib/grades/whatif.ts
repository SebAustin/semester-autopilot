import type { Course, Deliverable } from "../types";
import { effectiveWeightPct } from "./calc";

/**
 * Grade projection model. All percentages are normalized against the total
 * weight of MODELED work, so syllabi whose weights don't sum to exactly 100
 * still produce sane numbers.
 *
 * Scoring semantics:
 * - done + recorded score → graded at that score
 * - skipped → graded at 0 (that's what skipping means)
 * - everything else → ungraded; assumed at the current average, or 100 when
 *   nothing is graded yet ("assuming everything else goes perfectly")
 */

export interface GradeModelItem {
  id: string;
  title: string;
  weight: number;
  /** null = ungraded */
  score: number | null;
}

export type ScoreOverrides = Record<string, number>;

export function buildGradeModel(
  course: Course,
  courseDeliverables: Deliverable[],
): GradeModelItem[] {
  return courseDeliverables.map((d) => ({
    id: d.id,
    title: d.title,
    weight: effectiveWeightPct(d, course, courseDeliverables),
    score:
      d.status === "skipped"
        ? 0
        : d.status === "done" && d.score !== undefined
          ? d.score
          : null,
  }));
}

function scoreOf(
  item: GradeModelItem,
  overrides: ScoreOverrides,
): number | null {
  return overrides[item.id] !== undefined ? overrides[item.id] : item.score;
}

export interface GradeSummary {
  totalWeight: number;
  gradedWeight: number;
  /** 0–100 across graded work; null when nothing is graded */
  currentAvg: number | null;
  /** Score assumed for ungraded work in projections */
  assumedScore: number;
  /** 0–100 projected final grade; null when no weighted work exists */
  projected: number | null;
}

export function summarize(
  items: GradeModelItem[],
  overrides: ScoreOverrides = {},
): GradeSummary {
  let totalWeight = 0;
  let gradedWeight = 0;
  let earned = 0;

  for (const item of items) {
    totalWeight += item.weight;
    const score = scoreOf(item, overrides);
    if (score !== null) {
      gradedWeight += item.weight;
      earned += (score * item.weight) / 100;
    }
  }

  const currentAvg =
    gradedWeight > 0 ? (earned / gradedWeight) * 100 : null;
  const assumedScore = currentAvg ?? 100;
  const projected =
    totalWeight > 0
      ? ((earned + (assumedScore / 100) * (totalWeight - gradedWeight)) /
          totalWeight) *
        100
      : null;

  return { totalWeight, gradedWeight, currentAvg, assumedScore, projected };
}

export type NeededResult =
  | { kind: "needed"; pct: number }
  | { kind: "secured" }
  | { kind: "not-achievable" }
  | { kind: "no-weight" };

/**
 * Score needed on `focusId` to finish at `targetPct`, with other ungraded
 * work held at the assumed score.
 */
export function neededOn(
  items: GradeModelItem[],
  focusId: string,
  targetPct: number,
): NeededResult {
  const focus = items.find((item) => item.id === focusId);
  if (!focus || focus.weight <= 0) return { kind: "no-weight" };

  let totalWeight = 0;
  let earned = 0;
  let ungradedWeightExclFocus = 0;
  let gradedWeight = 0;

  for (const item of items) {
    totalWeight += item.weight;
    if (item.id === focusId) continue;
    if (item.score !== null) {
      gradedWeight += item.weight;
      earned += (item.score * item.weight) / 100;
    } else {
      ungradedWeightExclFocus += item.weight;
    }
  }

  const assumed = gradedWeight > 0 ? (earned / gradedWeight) * 100 : 100;
  const needed =
    ((targetPct / 100) * totalWeight -
      earned -
      (assumed / 100) * ungradedWeightExclFocus) /
    (focus.weight / 100);

  if (needed <= 0) return { kind: "secured" };
  if (needed > 100) return { kind: "not-achievable" };
  return { kind: "needed", pct: Math.round(needed * 10) / 10 };
}

/** Projected-grade delta (percentage points, ≤0) if `id` were skipped. */
export function impactOfSkipping(
  items: GradeModelItem[],
  id: string,
): number | null {
  const base = summarize(items).projected;
  const skipped = summarize(items, { [id]: 0 }).projected;
  if (base === null || skipped === null) return null;
  return Math.round((skipped - base) * 10) / 10;
}
