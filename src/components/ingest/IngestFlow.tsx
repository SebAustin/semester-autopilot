"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { todayISO } from "@/lib/dates/iso";
import {
  normalizeExtraction,
  type NormalizedExtraction,
} from "@/lib/extraction/normalize";
import type { ExtractResponse } from "@/lib/extraction/schema";
import { extractPdfText } from "@/lib/pdf/extractText";
import { useAppStore } from "@/lib/store/useAppStore";
import type { SourceKind } from "@/lib/types";

import { ExtractionProgress } from "./ExtractionProgress";
import { PasteTextCard } from "./PasteTextCard";
import { ReviewPanel } from "./ReviewPanel";
import { UploadDropzone } from "./UploadDropzone";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 75_000;

interface FlowError {
  title: string;
  message: string;
}

type FlowState =
  | { step: "idle"; error?: FlowError }
  | { step: "reading" }
  | { step: "calling" }
  | { step: "review"; draft: NormalizedExtraction; source: SourceKind };

export function IngestFlow() {
  const [state, setState] = useState<FlowState>({ step: "idle" });
  const commitExtraction = useAppStore((s) => s.commitExtraction);
  const router = useRouter();

  const fail = (title: string, message: string) =>
    setState({ step: "idle", error: { title, message } });

  async function runExtraction(text: string, source: SourceKind) {
    setState({ step: "calling" });
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const payload = (await response.json()) as ExtractResponse;
      if (!payload.ok) {
        fail("Extraction didn't go through", payload.message);
        return;
      }
      setState({
        step: "review",
        draft: normalizeExtraction(payload.result, todayISO()),
        source,
      });
    } catch {
      fail(
        "Extraction timed out",
        "The AI took too long or the connection dropped. Try again — or paste just the grading and schedule sections.",
      );
    }
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      fail("Not a PDF", "Drop a syllabus PDF, or paste its text below.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      fail("PDF too large", "Keep it under 10 MB — most syllabi are well under 1 MB.");
      return;
    }
    setState({ step: "reading" });
    try {
      const extracted = await extractPdfText(file);
      if (extracted.looksScanned) {
        fail(
          "This PDF looks scanned",
          "There's no text layer to read. Open the original and copy the text into the paste box instead.",
        );
        return;
      }
      await runExtraction(extracted.text, "pdf");
    } catch {
      fail(
        "Couldn't read that PDF",
        "The file may be corrupted or protected. Paste the syllabus text instead.",
      );
    }
  }

  function handleCommit(draft: NormalizedExtraction, source: SourceKind) {
    commitExtraction({
      name: draft.courseName,
      title: draft.courseTitle ?? undefined,
      meetingTimes: draft.meetingTimes,
      grading: draft.grading,
      source,
      deliverables: draft.rows
        .filter((row) => row.dueDate !== null)
        .map((row) => ({
          title: row.title,
          type: row.type,
          dueDate: row.dueDate as string,
          weightPct: row.weightPct ?? undefined,
          estimatedHours: row.estimatedHours,
        })),
    });
    router.push("/app");
  }

  if (state.step === "reading" || state.step === "calling") {
    return <ExtractionProgress stage={state.step} />;
  }

  if (state.step === "review") {
    return (
      <ReviewPanel
        draft={state.draft}
        onChange={(draft) => setState({ ...state, draft })}
        onCommit={() => handleCommit(state.draft, state.source)}
        onCancel={() => setState({ step: "idle" })}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Add courses
      </p>
      <h1 className="mt-3 font-display text-h1 text-ink">
        Syllabus in, semester out.
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
        Drop a syllabus PDF or paste its text. The AI drafts your deadlines and
        grading weights — <strong className="font-medium text-ink">you review
        every row</strong> before anything lands in your semester.
      </p>

      {state.error ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-danger/30 bg-danger-soft px-4 py-3"
        >
          <p className="text-sm font-semibold text-danger">{state.error.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{state.error.message}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6">
        <UploadDropzone onFile={handleFile} />
        <PasteTextCard onSubmit={(text) => runExtraction(text, "text")} />
      </div>
    </div>
  );
}
