import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Semester Autopilot
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-display text-ink">
          Your semester, on&nbsp;autopilot.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Drop in your syllabi. Get every deadline on one timeline, a
          grade-aware study plan, and a schedule that{" "}
          <em className="font-display not-italic text-ink">reroutes itself</em>{" "}
          when life happens.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/app"
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong"
          >
            Open the app
          </Link>
          <p className="text-sm text-ink-faint">
            Free · no signup · your data never leaves the browser
          </p>
        </div>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-ink-faint">
          <p>Built solo for ReverieHacks 2026</p>
          <p>MIT licensed · open source</p>
        </div>
      </footer>
    </main>
  );
}
