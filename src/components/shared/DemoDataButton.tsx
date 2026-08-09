"use client";

import { useAppStore } from "@/lib/store/useAppStore";

type Props = {
  variant?: "primary" | "ghost";
  label?: string;
};

export function DemoDataButton({
  variant = "primary",
  label = "Try with demo data",
}: Props) {
  const loadDemoData = useAppStore((state) => state.loadDemoData);

  const base =
    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150";
  const styles =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-strong"
      : "border border-line-strong text-ink-soft hover:border-accent hover:text-accent";

  return (
    <button type="button" onClick={loadDemoData} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}
