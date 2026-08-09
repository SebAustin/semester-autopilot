"use client";

import { buildSemesterICS, icsStampFromISO } from "@/lib/ics/build";
import { useAppStore } from "@/lib/store/useAppStore";

export function IcsExportButton() {
  const courses = useAppStore((state) => state.courses);
  const deliverables = useAppStore((state) => state.deliverables);
  const isEmpty = Object.keys(deliverables).length === 0;

  function handleExport() {
    const ics = buildSemesterICS(
      courses,
      deliverables,
      icsStampFromISO(new Date().toISOString()),
    );
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "semester-autopilot.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      disabled={isEmpty}
      onClick={handleExport}
      className="rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-150 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      Export .ics
    </button>
  );
}
