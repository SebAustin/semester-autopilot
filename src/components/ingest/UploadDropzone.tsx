"use client";

import { useRef, useState, type DragEvent } from "react";

type Props = {
  onFile: (file: File) => void;
};

export function UploadDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        aria-label="Upload a syllabus PDF"
        className={`group flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 transition-colors duration-150 ${
          isDragOver
            ? "border-accent bg-accent-soft"
            : "border-line-strong bg-surface hover:border-accent"
        }`}
      >
        <span className="font-display text-h2 text-ink">
          Drop a syllabus PDF
        </span>
        <span className="text-sm text-ink-faint">
          or click to choose a file · PDFs with real text, not scans
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </>
  );
}
