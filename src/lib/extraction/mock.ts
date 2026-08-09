import type { ExtractionResult } from "./schema";

/**
 * Fixture response for LLM_MOCK=1 — the parsed form of
 * fixtures/cs-3110-syllabus.txt, including the honest failure modes
 * (a "Week of" milestone and a TBD final, both null-dated, low confidence).
 */
export const MOCK_EXTRACTION: ExtractionResult = {
  courseName: "CS 3110",
  courseTitle: "Data Structures and Functional Programming",
  meetingTimes: [
    {
      days: ["Mon", "Wed", "Fri"],
      start: "10:10",
      end: "11:00",
      kind: "lecture",
      location: "Gates Hall G01",
    },
    {
      days: ["Tue"],
      start: "2:55pm",
      end: "4:10pm",
      kind: "recitation",
      location: null,
    },
  ],
  gradingCategories: [
    { name: "Problem Sets", weightPercent: 30 },
    { name: "Prelim 1", weightPercent: 15 },
    { name: "Prelim 2", weightPercent: 15 },
    { name: "Final Exam", weightPercent: 25 },
    { name: "Programming Project", weightPercent: 10 },
    { name: "Participation", weightPercent: 5 },
  ],
  deliverables: [
    {
      title: "PS1",
      type: "assignment",
      dueDate: "2026-09-04",
      dueDateRaw: "due Fri Sep 4",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "PS2",
      type: "assignment",
      dueDate: "2026-09-18",
      dueDateRaw: "due Fri Sep 18",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "PS3",
      type: "assignment",
      dueDate: "2026-10-02",
      dueDateRaw: "due Fri Oct 2",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "Prelim 1",
      type: "exam",
      dueDate: "2026-10-08",
      dueDateRaw: "Thursday, October 8, 7:30pm (Uris Hall Auditorium)",
      weightPercent: 15,
      confidence: "high",
    },
    {
      title: "PS4",
      type: "assignment",
      dueDate: "2026-10-23",
      dueDateRaw: "due Fri Oct 23",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "Prelim 2",
      type: "exam",
      dueDate: "2026-11-05",
      dueDateRaw: "Thursday, November 5, 7:30pm",
      weightPercent: 15,
      confidence: "high",
    },
    {
      title: "PS5",
      type: "assignment",
      dueDate: "2026-11-13",
      dueDateRaw: "due Fri Nov 13",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "Project milestone (design doc)",
      type: "project",
      dueDate: null,
      dueDateRaw: "Week of Nov 16",
      weightPercent: null,
      confidence: "low",
    },
    {
      title: "PS6",
      type: "assignment",
      dueDate: "2026-12-04",
      dueDateRaw: "due Fri Dec 4",
      weightPercent: null,
      confidence: "medium",
    },
    {
      title: "Final project",
      type: "project",
      dueDate: "2026-12-09",
      dueDateRaw: "Wednesday, December 9, 11:59pm",
      weightPercent: 10,
      confidence: "high",
    },
    {
      title: "Final Exam",
      type: "exam",
      dueDate: null,
      dueDateRaw: "date TBD (registrar schedules finals in November)",
      weightPercent: 25,
      confidence: "low",
    },
  ],
  warnings: [
    "The lowest problem set score is dropped — not reflected in weights.",
    "Participation (5%) has no dated deliverables.",
  ],
};
