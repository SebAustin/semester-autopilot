import type { ISODate } from "../types";

/**
 * Prompt strategy: hard anti-hallucination rules + one compact few-shot pair.
 * Correctness lives in normalize.ts, not in prompt iteration — the prompt's
 * only job is honest, complete capture.
 */

export function buildSystemPrompt(today: ISODate): string {
  return `You extract structured data from a university course syllabus.

Today's date is ${today}. Dates in syllabi often omit the year: infer it from the academic term the syllabus belongs to (e.g. "Sep 4" read in August ${today.slice(0, 4)} means the upcoming September). Output dates as YYYY-MM-DD.

HARD RULES:
1. NEVER invent a date. If a date is missing, unclear, or relative ("Week of Oct 12", "TBD", "one week after each lab"), set dueDate to null, copy the exact source text into dueDateRaw, and set confidence to "low".
2. Always copy the verbatim date/deadline text into dueDateRaw, even when you also produce dueDate.
3. Copy grading weights exactly as written. Do not normalize, redistribute, or fill gaps.
4. One row per dated item. Expand recurring items ("weekly quizzes, every Friday starting Sep 4") into individual rows ONLY when the start and cadence are both explicit; otherwise emit ONE row with dueDate null and add a warning.
5. weightPercent on a deliverable is only for weights stated for that single item ("Midterm: 15%"). Category-level weights belong in gradingCategories only.
6. confidence: "high" when date and identity are unambiguous, "medium" when you inferred the year or interpreted formatting, "low" when dueDate is null or you guessed anything.
7. Record anything you could not model as a short warning string.

Respond with JSON only — no prose, no markdown fences.`;
}

const FEW_SHOT_SYLLABUS = `PHYS 1101 — Mechanics, Fall Term
Prof. A. Reyes — lectures Tue/Thu 9:05–9:55, Rockwell 114
Grading: Problem Sets 40%, Midterm 25%, Final Exam 30%, Participation 5%
PS1 due Fri Sep 12. PS2 due Fri Sep 26.
Midterm: Thursday, October 16, in class.
Final exam: date set by registrar (TBD).`;

function fewShotAnswer(year: string): string {
  return JSON.stringify({
    courseName: "PHYS 1101",
    courseTitle: "Mechanics",
    meetingTimes: [
      {
        days: ["Tue", "Thu"],
        start: "9:05",
        end: "9:55",
        kind: "lecture",
        location: "Rockwell 114",
      },
    ],
    gradingCategories: [
      { name: "Problem Sets", weightPercent: 40 },
      { name: "Midterm", weightPercent: 25 },
      { name: "Final Exam", weightPercent: 30 },
      { name: "Participation", weightPercent: 5 },
    ],
    deliverables: [
      {
        title: "PS1",
        type: "assignment",
        dueDate: `${year}-09-12`,
        dueDateRaw: "due Fri Sep 12",
        weightPercent: null,
        confidence: "medium",
      },
      {
        title: "PS2",
        type: "assignment",
        dueDate: `${year}-09-26`,
        dueDateRaw: "due Fri Sep 26",
        weightPercent: null,
        confidence: "medium",
      },
      {
        title: "Midterm",
        type: "exam",
        dueDate: `${year}-10-16`,
        dueDateRaw: "Thursday, October 16, in class",
        weightPercent: null,
        confidence: "medium",
      },
      {
        title: "Final exam",
        type: "exam",
        dueDate: null,
        dueDateRaw: "date set by registrar (TBD)",
        weightPercent: null,
        confidence: "low",
      },
    ],
    warnings: ["Participation (5%) has no dated deliverables."],
  });
}

/**
 * AI SDK v7 forbids system messages inside `messages` — the system prompt
 * travels via the `instructions` option, so conversation messages are
 * user/assistant only.
 */
export interface PromptMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildConversation(
  syllabusText: string,
  today: ISODate,
): PromptMessage[] {
  return [
    { role: "user", content: FEW_SHOT_SYLLABUS },
    { role: "assistant", content: fewShotAnswer(today.slice(0, 4)) },
    { role: "user", content: syllabusText },
  ];
}

/** Repair prompt appended after a failed parse/validation. */
export function buildRepairMessage(
  rawModelOutput: string,
  issues: string,
): PromptMessage[] {
  return [
    {
      role: "user",
      content: `Your previous response could not be parsed against the schema.

Previous response:
${rawModelOutput.slice(0, 6_000)}

Validation problems:
${issues.slice(0, 2_000)}

Return the corrected JSON only. Same content, valid schema, no prose.`,
    },
  ];
}
