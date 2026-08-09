import type { DeliverableType } from "../types";

/**
 * Heuristic mapping from an extracted deliverable to a grading category, so
 * real syllabi (not just demo data) get meaningful grade weights. Scored,
 * with a threshold — a wrong guess is worse than no guess, because weights
 * drive the planner's prioritization.
 */

const TYPE_SYNONYMS: Record<DeliverableType, string[]> = {
  assignment: ["homework", "assignment", "problem", "set", "hw", "ps"],
  exam: ["exam", "midterm", "prelim", "final", "test"],
  quiz: ["quiz", "quizze"],
  project: ["project", "programming"],
  paper: ["paper", "essay", "research"],
  presentation: ["presentation"],
  reading: ["reading", "response"],
  other: [],
};

const MATCH_THRESHOLD = 2;
const PHRASE_SCORE = 3;
const TYPE_SCORE = 2;
const MARKER_SCORE = 2;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
    .map((token) => token.replace(/s$/, ""));
}

function tokensOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3) {
    return a.startsWith(b) || b.startsWith(a);
  }
  return false;
}

/** "PS1", "HW3" → assignment-series markers. */
function hasSeriesMarker(titleTokens: string[]): boolean {
  return titleTokens.some((token) => /^(ps|hw)\d*$/.test(token));
}

function scoreCategory(
  categoryName: string,
  title: string,
  type: DeliverableType,
): number {
  const categoryTokens = tokenize(categoryName);
  if (categoryTokens.length === 0) return 0;

  const titleLower = title.toLowerCase();
  const titleTokens = tokenize(title);
  let score = 0;

  if (titleLower.includes(categoryName.toLowerCase().trim())) {
    score += PHRASE_SCORE;
  }

  const synonyms = TYPE_SYNONYMS[type];
  if (
    categoryTokens.some((token) =>
      synonyms.some((synonym) => tokensOverlap(token, synonym)),
    )
  ) {
    score += TYPE_SCORE;
  }

  if (
    hasSeriesMarker(titleTokens) &&
    categoryTokens.some((token) =>
      ["problem", "homework", "set", "assignment"].includes(token),
    )
  ) {
    score += MARKER_SCORE;
  }

  const hasStrongOverlap = categoryTokens.some((token) =>
    titleTokens.some(
      (titleToken) =>
        token.length >= 3 &&
        titleToken.length >= 3 &&
        tokensOverlap(token, titleToken),
    ),
  );
  const hasWeakOverlap = categoryTokens.some((token) =>
    titleTokens.some((titleToken) => tokensOverlap(token, titleToken)),
  );
  score += hasStrongOverlap ? 2 : hasWeakOverlap ? 1 : 0;

  return score;
}

export function matchCategoryName(
  title: string,
  type: DeliverableType,
  categoryNames: string[],
): string | undefined {
  let best: { name: string; score: number } | undefined;
  for (const name of categoryNames) {
    const score = scoreCategory(name, title, type);
    if (score >= MATCH_THRESHOLD && (best === undefined || score > best.score)) {
      best = { name, score };
    }
  }
  return best?.name;
}
