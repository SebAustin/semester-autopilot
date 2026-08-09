"use client";

type Props = {
  stage: "reading" | "calling";
};

const STEPS = [
  { key: "reading", label: "Reading your file" },
  { key: "calling", label: "Reading the syllabus" },
  { key: "validating", label: "Checking every date" },
] as const;

export function ExtractionProgress({ stage }: Props) {
  const activeIndex = stage === "reading" ? 0 : 1;

  return (
    <div
      aria-live="polite"
      className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24"
    >
      <p className="font-display text-h2 text-ink">
        {STEPS[activeIndex].label}…
      </p>
      <ol className="mt-8 flex items-center gap-3" aria-label="Extraction progress">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${
                  isDone
                    ? "bg-ok"
                    : isActive
                      ? "animate-pulse bg-accent"
                      : "bg-line-strong"
                }`}
              />
              <span
                className={`text-sm ${isActive ? "font-medium text-ink" : "text-ink-faint"}`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span aria-hidden="true" className="h-px w-8 bg-line" />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 max-w-sm text-center text-sm text-ink-faint">
        Nothing is saved until you&apos;ve reviewed what the AI found.
      </p>
    </div>
  );
}
