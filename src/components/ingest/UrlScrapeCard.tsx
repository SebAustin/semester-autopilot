"use client";

import { useState } from "react";

type ScrapeState =
  | { step: "idle"; error?: string }
  | { step: "scraping" };

type Props = {
  onText: (markdown: string) => void;
};

export function UrlScrapeCard({ onText }: Props) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScrapeState>({ step: "idle" });
  const isScraping = state.step === "scraping";

  async function handleScrape() {
    if (url.trim().length === 0 || isScraping) return;
    setState({ step: "scraping" });
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: AbortSignal.timeout(50_000),
      });
      const payload = (await response.json()) as
        | { ok: true; markdown: string }
        | { ok: false; message: string };
      if (!payload.ok) {
        setState({ step: "idle", error: payload.message });
        return;
      }
      setState({ step: "idle" });
      onText(payload.markdown);
    } catch {
      setState({
        step: "idle",
        error: "Couldn't reach that page — check the link or paste the text instead.",
      });
    }
  }

  return (
    <section
      aria-label="Import from a link"
      className="rounded-lg border border-line bg-surface p-5"
    >
      <h2 className="text-sm font-medium text-ink">From a course page link</h2>
      <p className="mt-1 text-xs text-ink-faint">
        {"Public pages only — Canvas and other logged-in pages can't be read. Powered by Firecrawl."}
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void handleScrape();
        }}
      >
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://cs.example.edu/courses/3110"
          aria-label="Course page URL"
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={isScraping || url.trim().length === 0}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScraping ? "Reading…" : "Import"}
        </button>
      </form>
      {state.step === "idle" && state.error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}
