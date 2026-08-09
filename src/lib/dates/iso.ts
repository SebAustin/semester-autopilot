import type { ISODate, Weekday } from "../types";
import { WEEKDAYS } from "../types";

/**
 * The only module allowed to touch `Date`. All arithmetic happens on UTC
 * components of parsed ISO strings, so the host timezone can never shift a
 * calendar day. `todayISO` is the single deliberate exception: it reads the
 * user's local clock, because "today" is a local concept.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function isValidISODate(value: string): value is ISODate {
  const match = ISO_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

function assertISODate(value: string): asserts value is ISODate {
  if (!isValidISODate(value)) {
    throw new Error(`Invalid ISO date: "${value}"`);
  }
}

function toUTC(iso: ISODate): Date {
  assertISODate(iso);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date): ISODate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today on the user's local clock. */
export function todayISO(): ISODate {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUTC(date);
}

/** Whole days from `a` to `b`; positive when `b` is later. */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = toUTC(b).getTime() - toUTC(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** ISO strings compare correctly as strings; helper kept for intent. */
export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxISO(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

export function minISO(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function clampISO(iso: ISODate, min: ISODate, max: ISODate): ISODate {
  return minISO(maxISO(iso, min), max);
}

export function weekdayOf(iso: ISODate): Weekday {
  // getUTCDay: 0 = Sunday … 6 = Saturday; WEEKDAYS starts at Monday.
  const day = toUTC(iso).getUTCDay();
  return WEEKDAYS[(day + 6) % 7];
}

/** Monday of the week containing `iso` — the canonical week key. */
export function weekStartOf(iso: ISODate): ISODate {
  const day = toUTC(iso).getUTCDay();
  const offsetToMonday = (day + 6) % 7;
  return addDays(iso, -offsetToMonday);
}

/** Every date from `start` to `end` inclusive. */
export function eachDay(start: ISODate, end: ISODate): ISODate[] {
  const total = diffDays(start, end);
  if (total < 0) return [];
  const days: ISODate[] = [];
  for (let i = 0; i <= total; i += 1) {
    days.push(addDays(start, i));
  }
  return days;
}

/** "Aug 12" */
export function formatShort(iso: ISODate): string {
  const date = toUTC(iso);
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** "Tue, Aug 12" */
export function formatLong(iso: ISODate): string {
  return `${weekdayOf(iso)}, ${formatShort(iso)}`;
}
