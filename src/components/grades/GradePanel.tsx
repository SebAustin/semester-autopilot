"use client";

import { useMemo, useState } from "react";

import {
  buildGradeModel,
  impactOfSkipping,
  neededOn,
  summarize,
  type NeededResult,
  type ScoreOverrides,
} from "@/lib/grades/whatif";
import type { Course, Deliverable } from "@/lib/types";

import { WhatIfSlider } from "./WhatIfSlider";

const TARGETS = [80, 85, 90, 95] as const;
const MAX_SLIDERS = 4;

function fmt(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 10) / 10}`;
}

function neededCopy(result: NeededResult, title: string): string {
  switch (result.kind) {
    case "needed":
      return `You need ${result.pct} on ${title}.`;
    case "secured":
      return `Already secured — even a 0 on ${title} keeps you there.`;
    case "not-achievable":
      return `Out of reach even with 100 on ${title}.`;
    case "no-weight":
      return "Not enough grading info to compute this.";
  }
}

type Props = {
  course: Course;
  courseDeliverables: Deliverable[];
};

export function GradePanel({ course, courseDeliverables }: Props) {
  const [overrides, setOverrides] = useState<ScoreOverrides>({});
  const [target, setTarget] = useState<number>(90);

  const model = useMemo(
    () => buildGradeModel(course, courseDeliverables),
    [course, courseDeliverables],
  );
  const base = useMemo(() => summarize(model), [model]);
  const live = useMemo(() => summarize(model, overrides), [model, overrides]);

  const ungraded = useMemo(
    () =>
      model
        .filter((item) => item.score === null && item.weight > 0)
        .sort((a, b) => b.weight - a.weight),
    [model],
  );
  const focus = ungraded[0];
  const needed = focus ? neededOn(model, focus.id, target) : null;

  if (model.every((item) => item.weight === 0)) return null;

  const defaultSlider = Math.round(base.assumedScore);

  return (
    <section
      aria-label="Grade outlook"
      className="mt-8 rounded-lg border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h2 font-display text-ink">Grade outlook</h2>
        {Object.keys(overrides).length > 0 ? (
          <button
            type="button"
            onClick={() => setOverrides({})}
            className="text-xs font-medium text-accent hover:text-accent-strong"
          >
            Reset what-ifs
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Current
          </p>
          <p className="tnum mt-1 font-display text-3xl text-ink">
            {fmt(base.currentAvg)}
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">across graded work</p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Projected
          </p>
          <p
            data-testid="projected-grade"
            className="tnum mt-1 font-display text-3xl text-ink"
          >
            {fmt(live.projected)}
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            unscored work assumed at {Math.round(base.assumedScore)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-paper p-4">
          <div className="flex items-center gap-1">
            {TARGETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                aria-pressed={target === t}
                className={`tnum rounded-sm px-1.5 py-0.5 text-[11px] font-semibold transition-colors duration-150 ${
                  target === t
                    ? "bg-accent text-white"
                    : "text-ink-faint hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm leading-snug text-ink">
            {focus && needed
              ? neededCopy(needed, focus.title)
              : "Nothing ungraded left to plan for."}
          </p>
        </div>
      </div>

      {ungraded.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            What if I score…
          </p>
          <div className="mt-1 divide-y divide-line">
            {ungraded.slice(0, MAX_SLIDERS).map((item) => (
              <WhatIfSlider
                key={item.id}
                title={item.title}
                weightPct={item.weight}
                value={overrides[item.id] ?? defaultSlider}
                skipImpact={impactOfSkipping(model, item.id)}
                onChange={(value) =>
                  setOverrides((prev) => ({ ...prev, [item.id]: value }))
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
