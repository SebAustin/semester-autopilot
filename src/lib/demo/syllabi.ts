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

const HIST_2410: DemoCourse = {
  name: "HIST 2410",
  title: "The Atlantic World, 1450–1850",
  grading: [
    { name: "Participation", weight: 20 },
    { name: "Short Essays", weight: 30 },
    { name: "Presentation", weight: 10 },
    { name: "Research Paper", weight: 40 },
  ],
  meetingDays: [
    { days: ["Tue", "Thu"], start: "13:25", end: "14:40", kind: "lecture", location: "McGraw 165" },
  ],
  items: [
    { title: "Thornton, chs. 1–3", type: "reading", offset: -5, categoryName: "Participation", status: "done" },
    { title: "Map quiz", type: "quiz", offset: -10, categoryName: "Participation", status: "done", score: 88 },
    { title: "Thornton, chs. 4–6", type: "reading", offset: 2, categoryName: "Participation" },
    { title: "Essay 1 — First contacts", type: "paper", offset: 3, categoryName: "Short Essays", weightPct: 15 },
    { title: "Primary-source presentation", type: "presentation", offset: 17, categoryName: "Presentation", weightPct: 10 },
    { title: "Revolutions dossier reading", type: "reading", offset: 12, categoryName: "Participation" },
    { title: "Essay 2 — Middle passage economies", type: "paper", offset: 24, categoryName: "Short Essays", weightPct: 15 },
    { title: "Paper proposal + bibliography", type: "paper", offset: 38, categoryName: "Research Paper", estimatedHours: 3 },
    { title: "Research paper", type: "paper", offset: 66, categoryName: "Research Paper", weightPct: 40, estimatedHours: 16 },
  ],
};

const CHEM_1310: DemoCourse = {
  name: "CHEM 1310",
  title: "General Chemistry I",
  grading: [
    { name: "Weekly Quizzes", weight: 15 },
    { name: "Problem Sets", weight: 10 },
    { name: "Laboratory", weight: 25 },
    { name: "Midterm 1", weight: 15 },
    { name: "Midterm 2", weight: 15 },
    { name: "Final Exam", weight: 20 },
  ],
  meetingDays: [
    { days: ["Mon", "Wed", "Fri"], start: "09:05", end: "09:55", kind: "lecture", location: "Baker 200" },
    { days: ["Thu"], start: "13:00", end: "16:00", kind: "lab", location: "Baker basement labs" },
  ],
  items: [
    { title: "Quiz 1", type: "quiz", offset: -12, categoryName: "Weekly Quizzes", status: "done", score: 90 },
    { title: "Quiz 2", type: "quiz", offset: -5, categoryName: "Weekly Quizzes", status: "done", score: 76 },
    { title: "Quiz 3", type: "quiz", offset: 2, categoryName: "Weekly Quizzes" },
    { title: "Quiz 4", type: "quiz", offset: 9, categoryName: "Weekly Quizzes" },
    { title: "Quiz 5", type: "quiz", offset: 16, categoryName: "Weekly Quizzes" },
    { title: "Quiz 6", type: "quiz", offset: 23, categoryName: "Weekly Quizzes" },
    { title: "Quiz 7", type: "quiz", offset: 30, categoryName: "Weekly Quizzes" },
    { title: "Problem set 3", type: "assignment", offset: 1, categoryName: "Problem Sets", estimatedHours: 2.5 },
    { title: "Problem set 4", type: "assignment", offset: 8, categoryName: "Problem Sets", estimatedHours: 2.5 },
    { title: "Problem set 5", type: "assignment", offset: 15, categoryName: "Problem Sets", estimatedHours: 2.5 },
    { title: "Lab report 2 — Calorimetry", type: "assignment", offset: -3, categoryName: "Laboratory", status: "done", score: 85 },
    { title: "Lab report 3 — Titrations", type: "assignment", offset: 4, categoryName: "Laboratory" },
    { title: "Lab report 4 — Gas laws", type: "assignment", offset: 18, categoryName: "Laboratory" },
    { title: "Lab report 5 — Thermodynamics", type: "assignment", offset: 32, categoryName: "Laboratory" },
    { title: "Midterm 1", type: "exam", offset: 6, categoryName: "Midterm 1", weightPct: 15 },
    { title: "Midterm 2", type: "exam", offset: 34, categoryName: "Midterm 2", weightPct: 15 },
    { title: "Final exam (cumulative)", type: "exam", offset: 58, categoryName: "Final Exam", weightPct: 20, estimatedHours: 10 },
  ],
};

const DEMO_COURSES: DemoCourse[] = [CS_2110, HIST_2410, CHEM_1310];

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
