import { addDays } from "../dates/iso";
import type { Course, Deliverable, ISODate } from "../types";
import { escapeText, foldLine } from "./escape";

/**
 * All events are ALL-DAY (`VALUE=DATE`) on purpose: a deadline is a calendar
 * day, and date-only events carry no timezone — the whole class of TZ bugs
 * is structurally impossible in this export.
 */

export interface IcsEvent {
  uid: string;
  date: ISODate;
  title: string;
  description?: string;
}

function dateBasic(iso: ISODate): string {
  return iso.replace(/-/g, "");
}

function eventLines(event: IcsEvent, stamp: string): string[] {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dateBasic(event.date)}`,
    // DTEND is exclusive per RFC — the next day means "this whole day".
    `DTEND;VALUE=DATE:${dateBasic(addDays(event.date, 1))}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  lines.push("END:VEVENT");
  return lines;
}

/** `stamp` is an ICS UTC datetime like `20260809T130500Z` — injected for determinism. */
export function buildICS(events: IcsEvent[], stamp: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Semester Autopilot//ReverieHacks 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Semester Autopilot",
    ...events.flatMap((event) => eventLines(event, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function buildSemesterICS(
  courses: Record<string, Course>,
  deliverables: Record<string, Deliverable>,
  stamp: string,
): string {
  const events = Object.values(deliverables)
    .slice()
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    .map((deliverable): IcsEvent => {
      const course = courses[deliverable.courseId];
      const courseName = course ? course.name : "Course";
      const weight =
        deliverable.weightPct !== undefined
          ? ` · ${deliverable.weightPct}% of grade`
          : "";
      return {
        uid: `${deliverable.id}@semester-autopilot`,
        date: deliverable.dueDate,
        title: `${courseName}: ${deliverable.title}`,
        description: `${deliverable.type}${weight} · exported by Semester Autopilot`,
      };
    });
  return buildICS(events, stamp);
}

/** `2026-08-09T13:05:00.123Z` → `20260809T130500Z` */
export function icsStampFromISO(isoDateTime: string): string {
  return isoDateTime.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
