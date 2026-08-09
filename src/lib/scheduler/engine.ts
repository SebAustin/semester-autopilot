import {
  addDays,
  eachDay,
  formatShort,
  maxISO,
  weekStartOf,
  weekdayOf,
} from "../dates/iso";
import { effectiveWeightPct } from "../grades/calc";
import type {
  Course,
  Deliverable,
  ISODate,
  Plan,
  PlanConflict,
  StudyBlock,
  UserAvailability,
} from "../types";
import { DEFAULT_SCHEDULER_CONFIG, type SchedulerConfig } from "./config";

/**
 * Deterministic greedy forward-fill. No AI, no randomness, no wall clock —
 * same inputs, byte-identical plan. "Reroute" is simply a full recompute;
 * stable block keys let the UI animate the diff.
 *
 * All quantities are integer half-hours ("hh") internally.
 */

export interface BuildPlanInput {
  deliverables: Deliverable[];
  courses: Record<string, Course>;
  availability: UserAvailability;
  today: ISODate;
  config?: SchedulerConfig;
}

interface SchedTask {
  id: string;
  courseId: string;
  title: string;
  remaining: number;
  release: ISODate;
  deadline: ISODate;
  weight: number;
  importance: number;
  perDayCap: number;
}

interface OverdueItem {
  id: string;
  title: string;
  dueDate: ISODate;
}

const SCORE_EPS = 1e-9;

function prepareTasks(
  input: BuildPlanInput,
  config: SchedulerConfig,
): { tasks: SchedTask[]; overdue: OverdueItem[] } {
  const byCourse = new Map<string, Deliverable[]>();
  for (const d of input.deliverables) {
    const list = byCourse.get(d.courseId) ?? [];
    list.push(d);
    byCourse.set(d.courseId, list);
  }

  const pending = input.deliverables.filter((d) => d.status === "pending");
  const overdue = pending
    .filter((d) => d.dueDate < input.today)
    .map((d) => ({ id: d.id, title: d.title, dueDate: d.dueDate }))
    .sort((a, b) => (a.dueDate === b.dueDate ? (a.id < b.id ? -1 : 1) : a.dueDate < b.dueDate ? -1 : 1));

  const tasks = pending
    .filter((d) => d.dueDate >= input.today && d.estimatedHours > 0)
    .map((d): SchedTask => {
      const course = input.courses[d.courseId];
      const weight = course
        ? effectiveWeightPct(d, course, byCourse.get(d.courseId) ?? [])
        : (d.weightPct ?? 0);
      return {
        id: d.id,
        courseId: d.courseId,
        title: d.title,
        remaining: Math.round(d.estimatedHours * 2),
        release: maxISO(
          input.today,
          addDays(d.dueDate, -config.startWindowDays[d.type]),
        ),
        deadline: d.dueDate,
        weight,
        importance: 1 + weight / 10,
        perDayCap: config.perDayCapHalfHours[d.type],
      };
    })
    .sort((a, b) =>
      a.deadline === b.deadline
        ? a.id < b.id
          ? -1
          : 1
        : a.deadline < b.deadline
          ? -1
          : 1,
    );

  return { tasks, overdue };
}

function buildCapacity(
  days: ISODate[],
  availability: UserAvailability,
): Map<ISODate, number> {
  const blackouts = new Set(availability.blackoutDates);
  const capacity = new Map<ISODate, number>();
  for (const day of days) {
    capacity.set(
      day,
      blackouts.has(day)
        ? 0
        : Math.max(0, Math.round(availability.weeklyHours[weekdayOf(day)] * 2)),
    );
  }
  return capacity;
}

/** Half-hours this task could still get from `dayIndex` through its deadline. */
function futureEligibleHH(
  task: SchedTask,
  dayIndex: number,
  days: ISODate[],
  capLeft: Map<ISODate, number>,
  todayLoad: number,
): number {
  let total = 0;
  for (let i = dayIndex; i < days.length; i += 1) {
    const day = days[i];
    if (day > task.deadline) break;
    const taskCap = task.perDayCap - (i === dayIndex ? todayLoad : 0);
    total += Math.max(0, Math.min(capLeft.get(day) ?? 0, taskCap));
  }
  return total;
}

/** True when `a` outranks `b` under the deterministic tie-break chain. */
function beats(a: SchedTask, b: SchedTask): boolean {
  if (a.deadline !== b.deadline) return a.deadline < b.deadline;
  if (a.weight !== b.weight) return a.weight > b.weight;
  return a.id < b.id;
}

function selectCandidate(
  tasks: SchedTask[],
  day: ISODate,
  dayIndex: number,
  days: ISODate[],
  capLeft: Map<ISODate, number>,
  dayLoads: Map<string, number>,
): SchedTask | null {
  let best: SchedTask | null = null;
  let bestScore = -Infinity;

  for (const task of tasks) {
    if (task.remaining <= 0) continue;
    if (day < task.release || day > task.deadline) continue;
    const load = dayLoads.get(task.id) ?? 0;
    if (load >= task.perDayCap) continue;

    const future = futureEligibleHH(task, dayIndex, days, capLeft, load);
    const urgency = task.remaining / Math.max(1, future);
    const score = urgency * task.importance;

    if (
      best === null ||
      score > bestScore + SCORE_EPS ||
      (Math.abs(score - bestScore) <= SCORE_EPS && beats(task, best))
    ) {
      best = task;
      bestScore = score;
    }
  }
  return best;
}

function assembleBlocks(
  tasks: SchedTask[],
  pieces: Map<string, Map<ISODate, number>>,
): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  for (const task of tasks) {
    const perDate = pieces.get(task.id);
    if (!perDate) continue;
    const dates = [...perDate.keys()].sort();
    dates.forEach((date, index) => {
      blocks.push({
        key: `${task.id}#${index}`,
        deliverableId: task.id,
        courseId: task.courseId,
        date,
        hours: (perDate.get(date) ?? 0) / 2,
      });
    });
  }
  return blocks.sort((a, b) =>
    a.date === b.date ? (a.key < b.key ? -1 : 1) : a.date < b.date ? -1 : 1,
  );
}

function overdueConflict(overdue: OverdueItem[]): PlanConflict[] {
  if (overdue.length === 0) return [];
  const titles = overdue.map((item) => `"${item.title}"`);
  const shown = titles.slice(0, 3).join(", ");
  const suffix = overdue.length > 3 ? ` and ${overdue.length - 3} more` : "";
  return [
    {
      kind: "due-date-passed",
      deliverableIds: overdue.map((item) => item.id),
      message:
        overdue.length === 1
          ? `${shown} went past due — mark it done or skipped to clear this.`
          : `${shown}${suffix} went past due — mark them done or skipped.`,
    },
  ];
}

function shortfallConflicts(tasks: SchedTask[]): PlanConflict[] {
  const leftovers = tasks.filter((task) => task.remaining > 0);
  const conflicts: PlanConflict[] = leftovers.map((task) => ({
    kind: "impossible-deadline",
    deliverableIds: [task.id],
    shortfallHours: task.remaining / 2,
    message: `"${task.title}" won't fully fit — ${task.remaining / 2}h still unplaced before ${formatShort(task.deadline)}.`,
  }));

  const byWeek = new Map<ISODate, SchedTask[]>();
  for (const task of leftovers) {
    const week = weekStartOf(task.deadline);
    byWeek.set(week, [...(byWeek.get(week) ?? []), task]);
  }
  for (const week of [...byWeek.keys()].sort()) {
    const group = byWeek.get(week) ?? [];
    const shortfall = group.reduce((acc, t) => acc + t.remaining, 0) / 2;
    conflicts.push({
      kind: "overcommitted-week",
      weekStart: week,
      shortfallHours: shortfall,
      deliverableIds: group.map((t) => t.id).sort(),
      message: `Week of ${formatShort(week)} is ${shortfall}h over capacity — start earlier, trim estimates, or free up hours.`,
    });
  }
  return conflicts;
}

export function buildPlan(input: BuildPlanInput): Plan {
  const config = input.config ?? DEFAULT_SCHEDULER_CONFIG;
  const { tasks, overdue } = prepareTasks(input, config);

  let horizonEnd = addDays(input.today, config.minHorizonDays);
  for (const task of tasks) horizonEnd = maxISO(horizonEnd, task.deadline);

  const days = eachDay(input.today, horizonEnd);
  const capLeft = buildCapacity(days, input.availability);
  const pieces = new Map<string, Map<ISODate, number>>();

  days.forEach((day, dayIndex) => {
    const dayLoads = new Map<string, number>();
    while ((capLeft.get(day) ?? 0) > 0) {
      const task = selectCandidate(tasks, day, dayIndex, days, capLeft, dayLoads);
      if (!task) break;
      const load = dayLoads.get(task.id) ?? 0;
      const chunk = Math.min(
        task.remaining,
        task.perDayCap - load,
        capLeft.get(day) ?? 0,
      );
      dayLoads.set(task.id, load + chunk);
      capLeft.set(day, (capLeft.get(day) ?? 0) - chunk);
      task.remaining -= chunk;
      const perDate = pieces.get(task.id) ?? new Map<ISODate, number>();
      perDate.set(day, (perDate.get(day) ?? 0) + chunk);
      pieces.set(task.id, perDate);
    }
  });

  const blocks = assembleBlocks(tasks, pieces);
  const byWeek: Record<ISODate, number> = {};
  for (const block of blocks) {
    const week = weekStartOf(block.date);
    byWeek[week] = (byWeek[week] ?? 0) + block.hours;
  }

  return {
    blocks,
    conflicts: [...overdueConflict(overdue), ...shortfallConflicts(tasks)],
    horizon: { start: input.today, end: horizonEnd },
    stats: {
      totalHours: blocks.reduce((acc, block) => acc + block.hours, 0),
      byWeek,
    },
  };
}
