"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Semester" },
  { href: "/app/ingest", label: "Add courses" },
  { href: "/app/planner", label: "Planner" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-surface">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="py-3 font-display text-base tracking-tight text-ink hover:text-accent sm:text-lg"
        >
          Semester&nbsp;Autopilot
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 max-sm:w-full sm:pb-0">
          {LINKS.map((link) => {
            const isActive =
              link.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-sm px-3 py-1.5 text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-accent-soft font-medium text-accent-strong"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
