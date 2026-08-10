import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        404
      </p>
      <h1 className="mt-4 font-display text-h1 text-ink">
        This page took an unscheduled day off.
      </h1>
      <p className="mt-3 max-w-md text-base text-ink-soft">
        The link may be stale — but your semester is right where you left it.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/app"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong"
        >
          Back to the app
        </Link>
        <Link
          href="/"
          className="rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors duration-150 hover:border-accent hover:text-accent"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
