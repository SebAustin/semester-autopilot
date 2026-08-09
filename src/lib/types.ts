/**
 * Domain model for Semester Autopilot.
 *
 * Invariant: `ISODate` strings ('YYYY-MM-DD') are the ONLY date currency in
 * app state. Raw `Date` math lives exclusively in `lib/dates/iso.ts`.
 */

export type ISODate = string;

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type CourseColorIndex = 1 | 2 | 3 | 4 | 5 | 6;

export type SourceKind = "pdf" | "text" | "url" | "demo";

export interface MeetingTime {
  days: Weekday[];
  /** 'HH:MM' 24h, null when the syllabus doesn't say */
  start: string | null;
  end: string | null;
  kind: "lecture" | "lab" | "recitation" | "other";
  location?: string;
}

export interface GradeCategory {
  id: string;
  name: string;
  /** Percent of the course grade, 0–100. Normalized in lib/grades, never here. */
  weight: number;
}

export interface GradingScheme {
  categories: GradeCategory[];
}

export interface Course {
  id: string;
  /** Short code, e.g. "CS 2110" */
  name: string;
  /** Long title, e.g. "Object-Oriented Programming" */
  title?: string;
  colorIndex: CourseColorIndex;
  meetingTimes: MeetingTime[];
  grading: GradingScheme;
  source: SourceKind;
  /** ISO datetime */
  createdAt: string;
}

export type DeliverableType =
  | "assignment"
  | "exam"
  | "quiz"
  | "project"
  | "reading"
  | "paper"
  | "presentation"
  | "other";

export type DeliverableStatus = "pending" | "done" | "skipped";

export interface Deliverable {
  id: string;
  courseId: string;
  title: string;
  type: DeliverableType;
  dueDate: ISODate;
  /** 'HH:MM' 24h when the syllabus states one */
  dueTime?: string;
  categoryId?: string;
  /**
   * Explicit syllabus weight ("Midterm: 15%"). When absent, the effective
   * weight is derived as category.weight / itemsInCategory by lib/grades —
   * derived values are computed, never stored.
   */
  weightPct?: number;
  /** Study/work hours this item needs. Defaults by type, user-editable. */
  estimatedHours: number;
  status: DeliverableStatus;
  /** 0–100 once graded; feeds the what-if calculator */
  score?: number;
}

export interface UserAvailability {
  /** Study hours available per weekday */
  weeklyHours: Record<Weekday, number>;
  /** "Busy / missed" days — the reroute trigger */
  blackoutDates: ISODate[];
}

export interface SemesterSettings {
  name?: string;
  startDate: ISODate;
  endDate: ISODate;
}

/* ---------- Derived planning output (never persisted) ---------- */

export interface StudyBlock {
  /** `${deliverableId}#${n}` — stable across reroutes; animation identity */
  key: string;
  deliverableId: string;
  courseId: string;
  date: ISODate;
  /** 0.5-hour granularity */
  hours: number;
}

export type PlanConflictKind =
  | "impossible-deadline"
  | "overcommitted-week"
  | "due-date-passed";

export interface PlanConflict {
  kind: PlanConflictKind;
  /** Deterministic, human copy — e.g. "Week of Oct 12: need 21h, you have 14h" */
  message: string;
  deliverableIds: string[];
  weekStart?: ISODate;
  shortfallHours?: number;
}

export interface Plan {
  blocks: StudyBlock[];
  conflicts: PlanConflict[];
  horizon: { start: ISODate; end: ISODate };
  stats: {
    totalHours: number;
    /** Keyed by week start (Monday) */
    byWeek: Record<ISODate, number>;
  };
}

/* ---------- Ingest commit payloads (review table → store) ---------- */

export interface NewDeliverableInput {
  title: string;
  type: DeliverableType;
  dueDate: ISODate;
  dueTime?: string;
  categoryName?: string;
  weightPct?: number;
  estimatedHours?: number;
}

export interface NewCourseInput {
  name: string;
  title?: string;
  meetingTimes: MeetingTime[];
  grading: { name: string; weight: number }[];
  source: SourceKind;
  deliverables: NewDeliverableInput[];
}

/** Default effort by deliverable type (hours) — visible and editable in the UI. */
export const EFFORT_DEFAULTS: Record<DeliverableType, number> = {
  exam: 8,
  project: 10,
  paper: 6,
  presentation: 4,
  assignment: 3,
  quiz: 2,
  reading: 1.5,
  other: 2,
};

export const WEEKDAYS: readonly Weekday[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];
