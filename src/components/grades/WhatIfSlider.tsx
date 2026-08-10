"use client";

import * as Slider from "@radix-ui/react-slider";

type Props = {
  title: string;
  weightPct: number;
  value: number;
  /** Projected-grade delta if skipped entirely (≤0), null when unknown */
  skipImpact: number | null;
  onChange: (value: number) => void;
};

export function WhatIfSlider({
  title,
  weightPct,
  value,
  skipImpact,
  onChange,
}: Props) {
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-ink">{title}</p>
        <p className="tnum shrink-0 text-xs text-ink-faint">
          {Math.round(weightPct * 10) / 10}% of grade
        </p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Slider.Root
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={([next]) => onChange(next)}
          className="relative flex h-5 w-full touch-none select-none items-center"
        >
          <Slider.Track className="relative h-1.5 grow rounded-full bg-line">
            <Slider.Range className="absolute h-full rounded-full bg-accent" />
          </Slider.Track>
          <Slider.Thumb
            aria-label={`What-if score for ${title}`}
            className="block h-4 w-4 rounded-full border-2 border-accent bg-surface shadow-sm transition-transform duration-150 hover:scale-110 focus-visible:scale-110"
          />
        </Slider.Root>
        <p className="tnum w-10 shrink-0 text-right text-sm font-medium text-ink">
          {value}
        </p>
      </div>
      {skipImpact !== null && skipImpact < 0 ? (
        <p className="tnum mt-1 text-[11px] text-ink-faint">
          skipping this costs{" "}
          <span className="font-medium text-danger-strong">{skipImpact} pts</span> off
          your final grade
        </p>
      ) : null}
    </div>
  );
}
