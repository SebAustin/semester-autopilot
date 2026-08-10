"use client";

import type { NormalizedRow } from "@/lib/extraction/normalize";
import { isValidISODate } from "@/lib/dates/iso";
import type { DeliverableType } from "@/lib/types";

const TYPE_OPTIONS: DeliverableType[] = [
  "assignment",
  "quiz",
  "exam",
  "project",
  "paper",
  "presentation",
  "reading",
  "other",
];

type Props = {
  rows: NormalizedRow[];
  undated: NormalizedRow[];
  onRowsChange: (rows: NormalizedRow[], undated: NormalizedRow[]) => void;
};

export function ReviewTable({ rows, undated, onRowsChange }: Props) {
  function updateDated(index: number, patch: Partial<NormalizedRow>) {
    onRowsChange(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      undated,
    );
  }

  function removeDated(index: number) {
    onRowsChange(rows.filter((_, i) => i !== index), undated);
  }

  function updateUndated(index: number, patch: Partial<NormalizedRow>) {
    const next = { ...undated[index], ...patch };
    if (next.dueDate && isValidISODate(next.dueDate)) {
      // Row earned a date — promote it into the dated list, keeping sort order.
      onRowsChange(
        [...rows, next].sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)),
        undated.filter((_, i) => i !== index),
      );
      return;
    }
    onRowsChange(
      rows,
      undated.map((row, i) => (i === index ? next : row)),
    );
  }

  function removeUndated(index: number) {
    onRowsChange(rows, undated.filter((_, i) => i !== index));
  }

  return (
    <section aria-label="Deliverables" className="mt-8">
      <h2 className="text-h2 font-display text-ink">Deliverables</h2>

      <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
        {rows.map((row, index) => (
          <RowEditor
            key={`${row.title}-${row.dueDate}-${index}`}
            row={row}
            onPatch={(patch) => updateDated(index, patch)}
            onRemove={() => removeDated(index)}
          />
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-4 text-sm text-ink-faint">
            No dated deliverables yet.
          </li>
        ) : null}
      </ul>

      {undated.length > 0 ? (
        <section aria-label="Needs a date" className="mt-6">
          <h3 className="text-sm font-semibold text-warn-strong">
            Needs a date — the AI wouldn&apos;t guess
          </h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-warn/30 bg-surface">
            {undated.map((row, index) => (
              <RowEditor
                key={`undated-${row.title}-${index}`}
                row={row}
                onPatch={(patch) => updateUndated(index, patch)}
                onRemove={() => removeUndated(index)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

type RowEditorProps = {
  row: NormalizedRow;
  onPatch: (patch: Partial<NormalizedRow>) => void;
  onRemove: () => void;
};

function RowEditor({ row, onPatch, onRemove }: RowEditorProps) {
  const isLowConfidence = row.confidence === "low" || row.dueDate === null;

  return (
    <li
      className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${
        isLowConfidence ? "bg-warn-soft/60" : ""
      }`}
    >
      <div className="min-w-0 flex-1 basis-52">
        <input
          value={row.title}
          aria-label="Deliverable title"
          onChange={(event) => onPatch({ title: event.target.value })}
          className="w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink hover:border-line focus:border-accent"
        />
        {row.dueDateRaw ? (
          <p className="truncate px-1 text-xs italic text-ink-faint">
            syllabus says: “{row.dueDateRaw}”
          </p>
        ) : null}
      </div>

      <select
        value={row.type}
        aria-label="Deliverable type"
        onChange={(event) =>
          onPatch({ type: event.target.value as DeliverableType })
        }
        className="rounded-sm border border-line bg-paper px-2 py-1 text-xs text-ink-soft focus:border-accent"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={row.dueDate ?? ""}
        aria-label="Due date"
        onChange={(event) => onPatch({ dueDate: event.target.value || null })}
        className={`tnum rounded-sm border px-2 py-1 text-xs focus:border-accent ${
          row.dueDate ? "border-line bg-paper text-ink" : "border-warn bg-warn-soft text-warn"
        }`}
      />

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0.5}
          max={40}
          step={0.5}
          value={row.estimatedHours}
          aria-label="Estimated hours of work"
          onChange={(event) =>
            onPatch({ estimatedHours: Number(event.target.value) })
          }
          className="tnum w-14 rounded-sm border border-line bg-paper px-1.5 py-1 text-right text-xs text-ink focus:border-accent"
        />
        <span className="text-xs text-ink-faint">h</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${row.title}`}
        className="rounded-sm px-2 py-1 text-xs text-ink-faint transition-colors duration-150 hover:bg-danger-soft hover:text-danger"
      >
        Remove
      </button>
    </li>
  );
}
