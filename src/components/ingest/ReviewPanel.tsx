"use client";

import type {
  NormalizedExtraction,
  NormalizedRow,
} from "@/lib/extraction/normalize";

import { ReviewTable } from "./ReviewTable";

type Props = {
  draft: NormalizedExtraction;
  onChange: (draft: NormalizedExtraction) => void;
  onCommit: () => void;
  onCancel: () => void;
};

function weightSum(grading: NormalizedExtraction["grading"]): number {
  return Math.round(grading.reduce((acc, category) => acc + category.weight, 0));
}

export function ReviewPanel({ draft, onChange, onCommit, onCancel }: Props) {
  const sum = weightSum(draft.grading);
  const sumIsSane = sum >= 95 && sum <= 105;
  const datedCount = draft.rows.filter((row) => row.dueDate !== null).length;
  const canCommit = draft.courseName.trim().length > 0 && datedCount > 0;

  function patchRows(rows: NormalizedRow[], undated: NormalizedRow[]) {
    onChange({ ...draft, rows, undated });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Review what the AI found
      </p>
      <h1 className="mt-3 font-display text-h1 text-ink">
        Your call on every row.
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Amber rows are the AI admitting it wasn&apos;t sure — the original
        syllabus wording is shown so you can fix them in seconds.
      </p>

      <section aria-label="Course" className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Course code</span>
          <input
            value={draft.courseName}
            onChange={(event) =>
              onChange({ ...draft, courseName: event.target.value })
            }
            className="rounded-md border border-line bg-surface px-3 py-2 text-ink focus:border-accent"
            placeholder="CS 3110"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Title</span>
          <input
            value={draft.courseTitle ?? ""}
            onChange={(event) =>
              onChange({ ...draft, courseTitle: event.target.value || null })
            }
            className="rounded-md border border-line bg-surface px-3 py-2 text-ink focus:border-accent"
            placeholder="Data Structures and Functional Programming"
          />
        </label>
      </section>

      <section aria-label="Grading weights" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h2 font-display text-ink">Grading</h2>
          <span
            className={`tnum rounded-sm px-2 py-0.5 text-xs font-semibold ${
              sumIsSane ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
            }`}
          >
            Σ {sum}%
          </span>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
          {draft.grading.map((category, index) => (
            <li key={index} className="flex items-center gap-3 px-4 py-2.5">
              <input
                value={category.name}
                aria-label={`Category ${index + 1} name`}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    grading: draft.grading.map((c, i) =>
                      i === index ? { ...c, name: event.target.value } : c,
                    ),
                  })
                }
                className="w-full flex-1 rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink hover:border-line focus:border-accent"
              />
              <div className="flex shrink-0 items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={category.weight}
                  aria-label={`${category.name || "category"} weight percent`}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      grading: draft.grading.map((c, i) =>
                        i === index
                          ? { ...c, weight: Number(event.target.value) }
                          : c,
                      ),
                    })
                  }
                  className="tnum w-16 rounded-sm border border-line bg-paper px-2 py-1 text-right text-sm text-ink focus:border-accent"
                />
                <span className="text-xs text-ink-faint">%</span>
              </div>
            </li>
          ))}
          {draft.grading.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-faint">
              No grading breakdown found — you can still add the course.
            </li>
          ) : null}
        </ul>
      </section>

      <ReviewTable
        rows={draft.rows}
        undated={draft.undated}
        onRowsChange={patchRows}
      />

      {draft.warnings.length > 0 ? (
        <section
          aria-label="Extraction warnings"
          className="mt-6 rounded-md border border-warn/30 bg-warn-soft px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-warn">
            The AI flagged
          </p>
          <ul className="mt-1.5 list-disc pl-4 text-sm text-ink-soft">
            {draft.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="text-sm text-ink-soft">
          <span className="tnum font-medium text-ink">{datedCount}</span> dated
          deliverable{datedCount === 1 ? "" : "s"} ready
          {draft.undated.length > 0 ? (
            <span className="text-ink-faint">
              {" "}
              · {draft.undated.length} still need a date
            </span>
          ) : null}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-150 hover:border-danger hover:text-danger"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={!canCommit}
            onClick={onCommit}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint"
          >
            Add to my semester
          </button>
        </div>
      </footer>
    </div>
  );
}
