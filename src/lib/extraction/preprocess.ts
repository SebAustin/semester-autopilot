export const MAX_EXTRACTION_CHARS = 24_000;

/** Lines carrying deadline/grading signal — kept preferentially when over cap. */
const SIGNAL_RE =
  /\b(due|exam|quiz|midterm|final|prelim|project|paper|essay|presentation|assignment|problem set|ps\s?\d|hw\s?\d?|lab|report|milestone|proposal|grade|grading|weight|worth|percent|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t|tember)?|oct(ober)?|nov(ember)?|dec(ember)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week of|deadline)\b/i;

const DATE_LIKE_RE = /\d{1,2}[/-]\d{1,2}|\d{4}-\d{2}-\d{2}|%/;

function cleanWhitespace(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Normalize whitespace; when the document exceeds the cap, keep the lines
 * that matter (deadlines, weights, headers) instead of blindly truncating —
 * the tail of a syllabus often holds the schedule table.
 */
export function preprocessSyllabus(raw: string): string {
  const cleaned = cleanWhitespace(raw);
  if (cleaned.length <= MAX_EXTRACTION_CHARS) return cleaned;

  const lines = cleaned.split("\n");
  const kept: string[] = [];
  let total = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isShortHeader = trimmed.length > 0 && trimmed.length <= 60;
    const hasSignal = SIGNAL_RE.test(trimmed) || DATE_LIKE_RE.test(trimmed);
    if (!hasSignal && !isShortHeader) continue;

    kept.push(line);
    total += line.length + 1;
    if (total >= MAX_EXTRACTION_CHARS) break;
  }

  return kept.join("\n");
}
