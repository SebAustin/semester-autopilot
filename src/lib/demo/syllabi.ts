import { addDays } from "../dates/iso";
import type {
  Course,
  Deliverable,
  DeliverableStatus,
  DeliverableType,
  ISODate,
  SemesterSettings,
  UserAvailability,
} from "../types";
import { EFFORT_DEFAULTS } from "../types";

/**
 * Demo semester, generated RELATIVE TO TODAY so a judge always lands
 * mid-semester with real history behind them and a busy month ahead —
 * regardless of when they click. Static dates would strand them at week 0.
 */

export interface DemoData {
  courses: Record<string, Course>;
  deliverables: Record<string, Deliverable>;
  semester: SemesterSettings;
  availability: UserAvailability;
}

interface DemoItem {
  title: string;
  type: DeliverableType;
  /** Days relative to today; negative = already happened */
  offset: number;
  categoryName: string;
  weightPct?: number;
  estimatedHours?: number;
  status?: DeliverableStatus;
  score?: number;
}

interface DemoCourse {
  name: string;
  title: string;
  grading: { name: string; weight: number }[];
  meetingDays: Course["meetingTimes"];
  items: DemoItem[];
}

const CS_2110: DemoCourse = {
  name: "CS 2110",
  title: "Object-Oriented Programming & Data Structures",
  grading: [
    { name: "Homework", weight: 30 },
    { name: "Projects", weight: 25 },
    { name: "Midterm", weight: 20 },
    { name: "Final", weight: 25 },
  ],
  meetingDays: [
    { days: ["Mon", "Wed", "Fri"], start: "10:10", end: "11:00", kind: "lecture", location: "Statler Hall 185" },
  ],
  items: [
    { title: "HW 1 — Recursion warm-up", type: "assignment", offset: -16, categoryName: "Homework", status: "done", score: 92 },
    { title: "HW 2 — Linked lists", type: "assignment", offset: -9, categoryName: "Homework", status: "done", score: 85 },
    { title: "HW 3 — Trees & traversal", type: "assignment", offset: -2, categoryName: "Homework", status: "done", score: 78 },
    { title: "HW 4 — Hash tables", type: "assignment", offset: 5, categoryName: "Homework" },
    { title: "Project 1 — Text adventure engine", type: "project", offset: 9, categoryName: "Projects", estimatedHours: 12 },
    { title: "HW 5 — Graphs", type: "assignment", offset: 16, categoryName: "Homework" },
    { title: "Midterm exam", type: "exam", offset: 13, categoryName: "Midterm", weightPct: 20 },
    { title: "HW 6 — Concurrency", type: "assignment", offset: 26, categoryName: "Homework" },
    { title: "Project 2 — Pathfinding visualizer", type: "project", offset: 38, categoryName: "Projects", estimatedHours: 14 },
    { title: "Final exam", type: "exam", offset: 52, categoryName: "Final", weightPct: 25, estimatedHours: 10 },
  ],
};

const DEMO_COURSES: DemoCourse[] = [CS_2110];

const DEMO_AVAILABILITY: UserAvailability = {
  weeklyHours: { Mon: 2, Tue: 2.5, Wed: 2, Thu: 2.5, Fri: 1.5, Sat: 4, Sun: 3 },
  blackoutDates: [],
};

function demoId(seed: string): string {
  return `demo-${seed}`;
}

function buildCourse(
  spec: DemoCourse,
  index: number,
  today: ISODate,
): { course: Course; deliverables: Deliverable[] } {
  const courseId = demoId(spec.name.toLowerCase().replace(/\s+/g, "-"));
  const categories = spec.grading.map((category, i) => ({
    id: demoId(`${courseId}-cat-${i}`),
    name: category.name,
    weight: category.weight,
  }));
  const categoryId = (name: string): string | undefined =>
    categories.find((c) => c.name === name)?.id;

  const course: Course = {
    id: courseId,
    name: spec.name,
    title: spec.title,
    colorIndex: (((index % 6) + 1) as Course["colorIndex"]),
    meetingTimes: spec.meetingDays,
    grading: { categories },
    source: "demo",
    createdAt: new Date().toISOString(),
  };

  const deliverables = spec.items.map((item, i): Deliverable => ({
    id: demoId(`${courseId}-item-${i}`),
    courseId,
    title: item.title,
    type: item.type,
    dueDate: addDays(today, item.offset),
    categoryId: categoryId(item.categoryName),
    weightPct: item.weightPct,
    estimatedHours: item.estimatedHours ?? EFFORT_DEFAULTS[item.type],
    status: item.status ?? "pending",
    score: item.score,
  }));

  return { course, deliverables };
}

export function buildDemoData(today: ISODate): DemoData {
  const courses: Record<string, Course> = {};
  const deliverables: Record<string, Deliverable> = {};

  DEMO_COURSES.forEach((spec, index) => {
    const built = buildCourse(spec, index, today);
    courses[built.course.id] = built.course;
    for (const deliverable of built.deliverables) {
      deliverables[deliverable.id] = deliverable;
    }
  });

  return {
    courses,
    deliverables,
    semester: {
      name: "Fall 2026",
      startDate: addDays(today, -21),
      endDate: addDays(today, 75),
    },
    availability: DEMO_AVAILABILITY,
  };
}
