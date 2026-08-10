import Image from "next/image";
import Link from "next/link";

const REPO_URL = "https://github.com/SebAustin/semester-autopilot";

const STEPS = [
  {
    number: "01",
    title: "Drop your syllabi",
    body: "PDF, pasted text, or a course-page link. The AI drafts every deadline, grading weight, and meeting time it can find — and flags what it can't.",
  },
  {
    number: "02",
    title: "Review every row",
    body: "Nothing enters your semester unchecked. Low-confidence rows are highlighted with the exact source text, so a wrong date takes seconds to fix.",
  },
  {
    number: "03",
    title: "Live on autopilot",
    body: "One timeline across courses, calendar export, and a study plan balanced by grade weight. Miss a day? It reroutes — and tells you what's at risk.",
  },
] as const;

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className="border-t-2 border-ink pt-4">
      <p className="tnum font-display text-3xl text-ink-faint">{step.number}</p>
      <h3 className="mt-2 text-lg font-medium text-ink">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="mx-auto w-full max-w-6xl px-6 pt-20 sm:pt-28"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Semester Autopilot
        </p>
        <h1
          id="hero-heading"
          className="mt-5 max-w-3xl font-display text-display text-ink"
        >
          Your semester, on&nbsp;autopilot.
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Drop in your syllabi. Get every deadline on one timeline, a
            grade-aware study plan, and a schedule that{" "}
            <em className="font-display not-italic text-ink">
              reroutes itself
            </em>{" "}
            when life happens.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong"
            >
              Open the app
            </Link>
            <p className="text-sm text-ink-faint">
              Free · no signup · local-first
            </p>
          </div>
        </div>

        {/* Product shot */}
        <div className="mt-12 overflow-hidden rounded-lg border border-line bg-surface shadow-[0_24px_60px_-24px_rgb(0_0_0/0.18)]">
          <div className="flex items-center gap-1.5 border-b border-line bg-paper px-4 py-2.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="tnum mx-auto rounded-sm bg-surface px-3 py-0.5 text-[11px] text-ink-faint">
              semester-autopilot.vercel.app
            </span>
          </div>
          <Image
            src="/shots/hero.png"
            alt="Semester Autopilot's timeline: three courses as lanes, every deadline sized by grade weight, with a workload heatmap underneath"
            width={1360}
            height={690}
            priority
            fetchPriority="high"
            sizes="(max-width: 1152px) 100vw, 1104px"
          />
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-heading"
        className="mx-auto w-full max-w-6xl px-6 pt-24"
      >
        <h2 id="how-heading" className="font-display text-h1 text-ink">
          Three minutes to a plan.
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </section>

      {/* Bento features */}
      <section
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-6xl px-6 pt-24"
      >
        <h2 id="features-heading" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="rounded-lg bg-accent p-6 text-white md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide">
              The reroute
            </p>
            <p className="mt-3 font-display text-2xl leading-snug">
              {"Tap “I'm busy” on any day — watch two weeks of work reflow around it, like GPS around traffic."}
            </p>
            <p className="mt-3 text-sm">
              And when something genuinely no longer fits, it says so, in
              plain language — never silently overbooks you.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-6 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Grade what-if
            </p>
            <p className="mt-3 font-display text-2xl leading-snug text-ink">
              “What do I need on the final for an A?”
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              Weight-aware projections from your actual syllabus. Drag a
              slider, watch your projected grade move. See exactly what
              skipping that quiz costs.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-6 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              One timeline
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Every course, every deadline, sized by how much it moves your
              grade. Exams read as diamonds; heavy weeks glow in the heatmap.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-6 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Calendar export
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              One click to <span className="tnum font-medium text-ink">.ics</span> —
              lands cleanly in Google and Apple Calendar as all-day events, no
              timezone surprises.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-6 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Local-first
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              No account. Your courses live in your browser and export as
              JSON. The planner even works offline.
            </p>
          </div>
        </div>
      </section>

      {/* Honesty band */}
      <section
        aria-labelledby="trust-heading"
        className="mx-auto w-full max-w-6xl px-6 py-24"
      >
        <div className="rounded-lg border border-line bg-surface p-8 sm:p-10">
          <h2 id="trust-heading" className="font-display text-h2 text-ink">
            AI you can check. Math you can trust.
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-ink-soft">
              AI touches exactly one thing: reading your syllabus. It never
              invents a date — anything unclear is flagged{" "}
              <span className="font-medium text-warn-strong">needs a date</span> with
              the verbatim source text, and you approve every row before it
              counts.
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">
              Everything else — the scheduler, grade math, calendar export — is
              deterministic, open-source code with{" "}
              <span className="tnum font-medium text-ink">500+ tests</span>,
              fuzzed across 100 random semesters and two timezones. Same
              inputs, same plan. Every time.
            </p>
          </div>
          <p className="mt-6 border-t border-line pt-5 text-xs text-ink-faint">
            Free forever: no servers to pay for, runs against any
            OpenAI-compatible model — including a local one via Ollama, fully
            offline. MIT licensed.
          </p>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-faint">
          <p>
            Built solo for{" "}
            <a
              href="https://reverie-hacks-2026.devpost.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-accent"
            >
              ReverieHacks 2026
            </a>
          </p>
          <p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-accent"
            >
              Open source on GitHub
            </a>{" "}
            · MIT licensed
          </p>
        </div>
      </footer>
    </main>
  );
}
