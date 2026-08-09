import type { DeliverableType } from "../types";

/**
 * Tunable scheduling behavior, kept out of the algorithm so the engine's
 * functions stay small and the numbers stay explainable.
 *
 * All hour quantities inside the scheduler are INTEGER HALF-HOURS ("hh") —
 * zero floating-point drift by construction.
 */
export interface SchedulerConfig {
  /** Work on an item starts at most this many days before its deadline. */
  startWindowDays: Record<DeliverableType, number>;
  /** Max half-hours of one item scheduled on a single day. */
  perDayCapHalfHours: Record<DeliverableType, number>;
  /** The plan always looks at least this far ahead. */
  minHorizonDays: number;
}

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  startWindowDays: {
    assignment: 7,
    quiz: 4,
    reading: 5,
    exam: 10,
    presentation: 10,
    project: 14,
    paper: 14,
    other: 7,
  },
  perDayCapHalfHours: {
    assignment: 4, // 2h
    quiz: 4,
    reading: 4,
    presentation: 4,
    other: 4,
    exam: 6, // 3h — deep-work items may take bigger daily bites
    project: 6,
    paper: 6,
  },
  minHorizonDays: 28,
};
