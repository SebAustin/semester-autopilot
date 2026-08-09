import { addDays, isValidISODate } from "../dates/iso";
import type {
  DeliverableType,
  ISODate,
  MeetingTime,
  Weekday,
} from "../types";
import { EFFORT_DEFAULTS } from "../types";
import type {
  ExtractedDeliverable,
  ExtractedMeetingTime,
  ExtractionResult,
} from "./schema";

/**
 * Deterministic cleanup of LLM output. Fixing extraction quirks here — in
 * tested code — beats prompt whack-a-mole every time.
 */

export interface NormalizedRow {
  title: string;
  type: DeliverableType;
  dueDate: ISODate | null;
  dueDateRaw: string | null;
  weightPct: number | null;
  confidence: "high" | "medium" | "low";
  estimatedHours: number;
}

export interface NormalizedExtraction {
  courseName: string;
  courseTitle: string | null;
  meetingTimes: MeetingTime[];
  grading: { name: string; weight: number }[];
  /** Dated rows, deduped, sorted by due date */
  rows: NormalizedRow[];
  /** Rows the model honestly couldn't date — surfaced as "needs a date" */
  undated: NormalizedRow[];
  warnings: string[];
}

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

/** "sep", "sept", "september" → 9; "febtember" → null (not a real prefix). */
function monthFromName(token: string): number | null {
  const t = token.toLowerCase();
  if (t.length < 3) return null;
  if (t === "sept") return 9;
  const index = MONTH_NAMES.findIndex((name) => name.startsWith(t));
  return index === -1 ? null : index + 1;
}

const PAST_GRACE_DAYS = 120;

/** Pick the year that lands month/day inside the plausible academic window. */
function inferYear(month: number, day: number, today: ISODate): number {
  const currentYear = Number(today.slice(0, 4));
  const candidate = `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (!isValidISODate(candidate)) return currentYear;
  return candidate < addDays(today, -PAST_GRACE_DAYS)
    ? currentYear + 1
    : currentYear;
}

function buildDate(
  month: number,
  day: number,
  year: number | undefined,
  today: ISODate,
): ISODate | null {
  const resolvedYear =
    year === undefined
      ? inferYear(month, day, today)
      : year < 100
        ? 2000 + year
        : year;
  const iso = `${resolvedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isValidISODate(iso) ? iso : null;
}

const SLASH_RE = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/;
const MONTH_NAME_RE =
  /^(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/i;

/** Coerce common syllabus date formats to ISO; null when not parseable. */
export function coerceISODate(
  input: string | null | undefined,
  today: ISODate,
): ISODate | null {
  if (!input) return null;
  const s = input.trim().replace(/^due\s+/i, "");
  if (isValidISODate(s)) return s;

  const slash = SLASH_RE.exec(s);
  if (slash) {
    const year = slash[3] === undefined ? undefined : Number(slash[3]);
    return buildDate(Number(slash[1]), Number(slash[2]), year, today);
  }

  const named = MONTH_NAME_RE.exec(s);
  if (named) {
    const month = monthFromName(named[1]);
    if (month === null) return null;
    const year = named[3] === undefined ? undefined : Number(named[3]);
    return buildDate(month, Number(named[2]), year, today);
  }

  return null;
}

const TIME_RE = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;

/** "7:30pm" → "19:30" · "9am" → "09:00" · "10:10" → "10:10" · junk → null */
export function coerceTimeHHMM(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = TIME_RE.exec(input.trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (hours > 23 || minutes > 59) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function clampWeight(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function normalizeGrading(raw: ExtractionResult["gradingCategories"]): {
  grading: { name: string; weight: number }[];
  warning: string | null;
} {
  const grading = raw
    .filter((category) => category.name.trim().length > 0)
    .map((category) => ({
      name: category.name.trim(),
      weight: clampWeight(category.weightPercent),
    }));
  const sum = grading.reduce((acc, category) => acc + category.weight, 0);
  const warning =
    grading.length > 0 && (sum < 95 || sum > 105)
      ? `Grading weights sum to ${Math.round(sum)}% — double-check the categories.`
      : null;
  return { grading, warning };
}

function normalizeMeetingTimes(raw: ExtractedMeetingTime[]): MeetingTime[] {
  return raw
    .filter((meeting) => meeting.days.length > 0)
    .map((meeting) => ({
      days: meeting.days as Weekday[],
      start: coerceTimeHHMM(meeting.start),
      end: coerceTimeHHMM(meeting.end),
      kind: meeting.kind,
      location: meeting.location ?? undefined,
    }));
}

function rowFromExtracted(
  item: ExtractedDeliverable,
  today: ISODate,
): NormalizedRow {
  const dueDate =
    coerceISODate(item.dueDate, today) ?? coerceISODate(item.dueDateRaw, today);
  return {
    title: item.title.trim(),
    type: item.type,
    dueDate,
    dueDateRaw: item.dueDateRaw,
    weightPct:
      item.weightPercent === null ? null : clampWeight(item.weightPercent),
    confidence: item.confidence,
    estimatedHours: EFFORT_DEFAULTS[item.type],
  };
}

function dedupeRows(rows: NormalizedRow[]): NormalizedRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.title.toLowerCase().replace(/\s+/g, " ")}|${row.dueDate ?? "?"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeExtraction(
  raw: ExtractionResult,
  today: ISODate,
): NormalizedExtraction {
  const { grading, warning } = normalizeGrading(raw.gradingCategories);

  const allRows = dedupeRows(
    raw.deliverables
      .map((item) => rowFromExtracted(item, today))
      .filter((row) => row.title.length > 0),
  );

  const rows = allRows
    .filter((row) => row.dueDate !== null)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  const undated = allRows.filter((row) => row.dueDate === null);

  return {
    courseName: raw.courseName.trim(),
    courseTitle: raw.courseTitle?.trim() || null,
    meetingTimes: normalizeMeetingTimes(raw.meetingTimes),
    grading,
    rows,
    undated,
    warnings: [...raw.warnings, ...(warning ? [warning] : [])],
  };
}
