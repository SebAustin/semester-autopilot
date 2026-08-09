import type { ReactNode } from "react";

type Props = {
  kicker: string;
  headline: string;
  body: string;
  children?: ReactNode;
};

export function EmptyState({ kicker, headline, body, children }: Props) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-4 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {kicker}
      </p>
      <h1 className="font-display text-h1 text-ink">{headline}</h1>
      <p className="text-base leading-relaxed text-ink-soft">{body}</p>
      {children ? <div className="mt-2 flex gap-3">{children}</div> : null}
    </section>
  );
}
