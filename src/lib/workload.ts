import { weekStartOf } from "./dates/iso";
import type { Deliverable, ISODate } from "./types";

/** Hours of estimated work coming due per week (keyed by Monday). */
export function dueHoursByWeek(
  deliverables: Deliverable[],
): Record<ISODate, number> {
  const byWeek: Record<ISODate, number> = {};
  for (const deliverable of deliverables) {
    if (deliverable.status === "skipped") continue;
    const week = weekStartOf(deliverable.dueDate);
    byWeek[week] = (byWeek[week] ?? 0) + deliverable.estimatedHours;
  }
  return byWeek;
}
