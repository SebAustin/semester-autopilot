import {
  addDays,
  diffDays,
  eachDay,
  maxISO,
  minISO,
  weekStartOf,
} from "./dates/iso";
import type { Deliverable, ISODate, SemesterSettings } from "./types";

const MIN_SPAN_DAYS = 28;
const EDGE_PAD_DAYS = 7;

export interface TimelineRange {
  start: ISODate;
  end: ISODate;
  /** Monday of every week in range — the shared column grid for timeline + heatmap. */
  weeks: ISODate[];
}

export function computeTimelineRange(
  deliverables: Deliverable[],
  semester: SemesterSettings | null,
  today: ISODate,
): TimelineRange {
  const dates = deliverables.map((d) => d.dueDate);
  let start =
    semester?.startDate ?? addDays(dates.reduce(minISO, today), -EDGE_PAD_DAYS);
  let end =
    semester?.endDate ?? addDays(dates.reduce(maxISO, today), EDGE_PAD_DAYS);

  start = weekStartOf(minISO(start, today));
  if (diffDays(start, end) < MIN_SPAN_DAYS) end = addDays(start, MIN_SPAN_DAYS);

  const weeks = eachDay(start, end).filter(
    (date) => weekStartOf(date) === date,
  );
  return { start, end, weeks };
}
