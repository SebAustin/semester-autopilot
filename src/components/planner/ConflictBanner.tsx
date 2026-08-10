"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { PlanConflict } from "@/lib/types";

const VISIBLE_BY_DEFAULT = 2;

const KIND_STYLES: Record<
  PlanConflict["kind"],
  { container: string; label: string; labelText: string }
> = {
  "due-date-passed": {
    container: "border-danger/30 bg-danger-soft",
    label: "text-danger-strong",
    labelText: "Past due",
  },
  "impossible-deadline": {
    container: "border-danger/30 bg-danger-soft",
    label: "text-danger-strong",
    labelText: "Won't fit",
  },
  "overcommitted-week": {
    container: "border-warn/40 bg-warn-soft",
    label: "text-warn-strong",
    labelText: "Heavy week",
  },
};

type Props = {
  conflicts: PlanConflict[];
};

export function ConflictBanner({ conflicts }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visible = isExpanded
    ? conflicts
    : conflicts.slice(0, VISIBLE_BY_DEFAULT);
  const hiddenCount = conflicts.length - visible.length;

  return (
    <AnimatePresence initial={false}>
      {conflicts.length > 0 ? (
        <motion.section
          aria-label="Plan conflicts"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="grid gap-2"
        >
          {visible.map((conflict, index) => {
            const style = KIND_STYLES[conflict.kind];
            return (
              <div
                key={`${conflict.kind}-${conflict.weekStart ?? index}`}
                role="status"
                className={`flex items-baseline gap-3 rounded-md border px-4 py-2.5 ${style.container}`}
              >
                <span
                  className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${style.label}`}
                >
                  {style.labelText}
                </span>
                <p className="text-sm text-ink-soft">{conflict.message}</p>
              </div>
            );
          })}
          {hiddenCount > 0 || isExpanded ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="justify-self-start text-xs font-medium text-ink-faint transition-colors duration-150 hover:text-accent"
            >
              {isExpanded
                ? "Show fewer"
                : `Show ${hiddenCount} more conflict${hiddenCount === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
