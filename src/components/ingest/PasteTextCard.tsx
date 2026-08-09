"use client";

import { useState } from "react";

const MIN_CHARS = 40;

type Props = {
  onSubmit: (text: string) => void;
};

export function PasteTextCard({ onSubmit }: Props) {
  const [text, setText] = useState("");
  const isReady = text.trim().length >= MIN_CHARS;

  return (
    <section
      aria-label="Paste syllabus text"
      className="rounded-lg border border-line bg-surface p-5"
    >
      <label
        htmlFor="syllabus-text"
        className="text-sm font-medium text-ink"
      >
        …or paste the syllabus text
      </label>
      <textarea
        id="syllabus-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={7}
        placeholder="Paste everything — course info, grading breakdown, schedule. Messy is fine."
        className="mt-3 w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-accent"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="tnum text-xs text-ink-faint">
          {text.trim().length < MIN_CHARS
            ? `${Math.max(0, MIN_CHARS - text.trim().length)} more characters to go`
            : `${text.trim().length.toLocaleString()} characters`}
        </p>
        <button
          type="button"
          disabled={!isReady}
          onClick={() => onSubmit(text)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint"
        >
          Extract deadlines
        </button>
      </div>
    </section>
  );
}
