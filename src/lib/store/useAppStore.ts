import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildDemoData } from "../demo/syllabi";
import { todayISO } from "../dates/iso";
import type {
  Course,
  Deliverable,
  DeliverableStatus,
  ISODate,
  NewCourseInput,
  SemesterSettings,
  UserAvailability,
  Weekday,
} from "../types";
import { EFFORT_DEFAULTS } from "../types";

const MAX_DAILY_HOURS = 16;

/** SSR/SSG-safe storage: the server prerenders only the skeleton, never state. */
const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const DEFAULT_AVAILABILITY: UserAvailability = {
  weeklyHours: { Mon: 2, Tue: 2, Wed: 2, Thu: 2, Fri: 2, Sat: 4, Sun: 3 },
  blackoutDates: [],
};

interface PersistedState {
  courses: Record<string, Course>;
  deliverables: Record<string, Deliverable>;
  availability: UserAvailability;
  semester: SemesterSettings | null;
  demoLoadedAt?: string;
}

export interface AppState extends PersistedState {
  commitExtraction: (input: NewCourseInput) => string;
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  setStatus: (id: string, status: DeliverableStatus) => void;
  removeCourse: (courseId: string) => void;
  toggleBlackout: (date: ISODate) => void;
  setWeeklyHours: (day: Weekday, hours: number) => void;
  loadDemoData: () => void;
  resetAll: () => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
}

const initialState: PersistedState = {
  courses: {},
  deliverables: {},
  availability: DEFAULT_AVAILABILITY,
  semester: null,
};

function nextColorIndex(courses: Record<string, Course>): Course["colorIndex"] {
  return ((Object.keys(courses).length % 6) + 1) as Course["colorIndex"];
}

function courseFromInput(
  input: NewCourseInput,
  colorIndex: Course["colorIndex"],
): { course: Course; deliverables: Deliverable[] } {
  const courseId = crypto.randomUUID();
  const categories = input.grading.map((category) => ({
    id: crypto.randomUUID(),
    name: category.name,
    weight: category.weight,
  }));
  const categoryByName = new Map(
    categories.map((category) => [category.name.toLowerCase(), category.id]),
  );

  const course: Course = {
    id: courseId,
    name: input.name,
    title: input.title,
    colorIndex,
    meetingTimes: input.meetingTimes,
    grading: { categories },
    source: input.source,
    createdAt: new Date().toISOString(),
  };

  const deliverables = input.deliverables.map((item): Deliverable => {
    const categoryId = item.categoryName
      ? categoryByName.get(item.categoryName.toLowerCase())
      : undefined;
    return {
      id: crypto.randomUUID(),
      courseId,
      title: item.title,
      type: item.type,
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      categoryId,
      weightPct: item.weightPct,
      estimatedHours: item.estimatedHours ?? EFFORT_DEFAULTS[item.type],
      status: "pending",
    };
  });

  return { course, deliverables };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      commitExtraction: (input) => {
        const { course, deliverables } = courseFromInput(
          input,
          nextColorIndex(get().courses),
        );
        set((state) => ({
          courses: { ...state.courses, [course.id]: course },
          deliverables: {
            ...state.deliverables,
            ...Object.fromEntries(deliverables.map((d) => [d.id, d])),
          },
        }));
        return course.id;
      },

      updateDeliverable: (id, patch) =>
        set((state) => {
          const existing = state.deliverables[id];
          if (!existing) return state;
          return {
            deliverables: {
              ...state.deliverables,
              [id]: { ...existing, ...patch, id, courseId: existing.courseId },
            },
          };
        }),

      setStatus: (id, status) => get().updateDeliverable(id, { status }),

      removeCourse: (courseId) =>
        set((state) => ({
          courses: Object.fromEntries(
            Object.entries(state.courses).filter(([id]) => id !== courseId),
          ),
          deliverables: Object.fromEntries(
            Object.entries(state.deliverables).filter(
              ([, deliverable]) => deliverable.courseId !== courseId,
            ),
          ),
        })),

      toggleBlackout: (date) =>
        set((state) => {
          const current = state.availability.blackoutDates;
          const blackoutDates = current.includes(date)
            ? current.filter((d) => d !== date)
            : [...current, date].sort();
          return { availability: { ...state.availability, blackoutDates } };
        }),

      setWeeklyHours: (day, hours) =>
        set((state) => {
          const clamped = Math.min(
            MAX_DAILY_HOURS,
            Math.max(0, Math.round(hours * 2) / 2),
          );
          return {
            availability: {
              ...state.availability,
              weeklyHours: {
                ...state.availability.weeklyHours,
                [day]: clamped,
              },
            },
          };
        }),

      loadDemoData: () => {
        const demo = buildDemoData(todayISO());
        set({
          courses: demo.courses,
          deliverables: demo.deliverables,
          semester: demo.semester,
          availability: demo.availability,
          demoLoadedAt: new Date().toISOString(),
        });
      },

      resetAll: () => set({ ...initialState, demoLoadedAt: undefined }),

      exportJson: () => {
        const { courses, deliverables, availability, semester } = get();
        return JSON.stringify(
          { app: "semester-autopilot", version: 1, courses, deliverables, availability, semester },
          null,
          2,
        );
      },

      importJson: (raw) => {
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          (parsed as { app?: unknown }).app !== "semester-autopilot"
        ) {
          throw new Error("That file doesn't look like a Semester Autopilot export.");
        }
        const data = parsed as Partial<PersistedState>;
        set({
          courses: data.courses ?? {},
          deliverables: data.deliverables ?? {},
          availability: data.availability ?? DEFAULT_AVAILABILITY,
          semester: data.semester ?? null,
        });
      },
    }),
    {
      name: "semester-autopilot-v1",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      skipHydration: true,
      partialize: (state): PersistedState => ({
        courses: state.courses,
        deliverables: state.deliverables,
        availability: state.availability,
        semester: state.semester,
        demoLoadedAt: state.demoLoadedAt,
      }),
    },
  ),
);
