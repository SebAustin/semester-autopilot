import { z } from "zod";

/**
 * The LLM boundary. Every field the model might not find is `.nullable()`
 * (not optional) — explicit nulls survive JSON-mode output on open models far
 * more reliably than missing keys, and they force the model to admit absence
 * instead of inventing values. `dueDateRaw` + `confidence` power the review
 * table's honesty UX.
 */

const weekdayEnum = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export const extractionSchema = z.object({
  courseName: z
    .string()
    .min(1)
    .describe('Short course code, e.g. "CS 2110" or "HIST 2410"'),
  courseTitle: z
    .string()
    .nullable()
    .describe('Long course title, e.g. "General Chemistry I", or null'),
  meetingTimes: z
    .array(
      z.object({
        days: z.array(weekdayEnum),
        start: z
          .string()
          .nullable()
          .describe('Start time exactly as written, e.g. "10:10" or "7:30pm"'),
        end: z.string().nullable(),
        kind: z.enum(["lecture", "lab", "recitation", "other"]),
        location: z.string().nullable(),
      }),
    )
    .default([]),
  gradingCategories: z
    .array(
      z.object({
        name: z.string(),
        weightPercent: z
          .number()
          .describe("Percent of course grade, copied exactly from the syllabus"),
      }),
    )
    .default([]),
  deliverables: z
    .array(
      z.object({
        title: z.string(),
        type: z.enum([
          "assignment",
          "exam",
          "quiz",
          "project",
          "reading",
          "paper",
          "presentation",
          "other",
        ]),
        dueDate: z
          .string()
          .nullable()
          .describe("YYYY-MM-DD, or null when the date cannot be determined"),
        dueDateRaw: z
          .string()
          .nullable()
          .describe(
            'Verbatim date text from the syllabus, e.g. "Week of Oct 12", "TBD"',
          ),
        weightPercent: z
          .number()
          .nullable()
          .describe("Explicit % weight for THIS single item only, else null"),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .default([]),
  warnings: z
    .array(z.string())
    .default([])
    .describe("Anything ambiguous or unmodelable, one short sentence each"),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
export type ExtractedDeliverable = ExtractionResult["deliverables"][number];
export type ExtractedMeetingTime = ExtractionResult["meetingTimes"][number];

/* ---------- API contract for POST /api/extract ---------- */

export type ExtractErrorCode =
  | "invalid-input"
  | "provider-not-configured"
  | "rate-limited"
  | "extraction-failed"
  | "provider-down";

export const extractRequestSchema = z.object({
  text: z.string().min(40, "That doesn't look like a syllabus yet"),
  source: z.enum(["pdf", "text", "url"]),
});

export type ExtractRequestBody = z.infer<typeof extractRequestSchema>;

export type ExtractResponse =
  | { ok: true; result: ExtractionResult }
  | { ok: false; error: ExtractErrorCode; message: string };
