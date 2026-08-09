"use client";

import * as Slider from "@radix-ui/react-slider";

import { useAppStore } from "@/lib/store/useAppStore";
import { WEEKDAYS } from "@/lib/types";

const MAX_HOURS = 8;

export function AvailabilityEditor() {
  const weeklyHours = useAppStore((state) => state.availability.weeklyHours);
  const setWeeklyHours = useAppStore((state) => state.setWeeklyHours);

  const total = WEEKDAYS.reduce((acc, day) => acc + weeklyHours[day], 0);

  return (
    <section
      aria-label="Weekly study hours"
      className="rounded-lg border border-line bg-surface p-5"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-ink">
          Hours you can study, per weekday
        </h2>
        <p className="tnum text-sm text-ink-soft">
          <span className="font-semibold text-ink">{total}h</span> / week
        </p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-x-6 gap-y-5 sm:grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div key={day} className="flex flex-col items-center gap-2">
            <Slider.Root
              orientation="vertical"
              min={0}
              max={MAX_HOURS}
              step={0.5}
              value={[weeklyHours[day]]}
              onValueChange={([value]) => setWeeklyHours(day, value)}
              className="relative flex h-24 w-5 touch-none select-none flex-col items-center"
            >
              <Slider.Track className="relative h-full w-1.5 grow rounded-full bg-line">
                <Slider.Range className="absolute w-full rounded-full bg-accent" />
              </Slider.Track>
              <Slider.Thumb
                aria-label={`${day} hours`}
                className="block h-4 w-4 rounded-full border-2 border-accent bg-surface shadow-sm transition-transform duration-150 hover:scale-110 focus-visible:scale-110"
              />
            </Slider.Root>
            <p className="text-xs font-medium text-ink-soft">{day}</p>
            <p className="tnum text-xs text-ink-faint">{weeklyHours[day]}h</p>
          </div>
        ))}
      </div>
    </section>
  );
}
