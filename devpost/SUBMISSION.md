# Devpost submission — paste-ready fields

> Track: **Software Development** · Team: solo
> Fill the video URL after uploading the edited cut (see ../../video/VIDEO-SCRIPT.md).

## Project name

Semester Autopilot

## Tagline (short description)

GPS for your semester — syllabi in, every deadline on one timeline, a
grade-aware study plan that visibly reroutes when life happens.

## Links

- **Try it (no signup):** https://semester-autopilot.vercel.app — press *Try with demo data*
- **Code:** https://github.com/SebAustin/semester-autopilot (MIT)
- **Demo video:** *(paste YouTube/Vimeo link)*

---

## Inspiration

Every semester begins with the same ritual: four to six syllabus PDFs,
an evening of hand-copying deadlines into a calendar, and the quiet
certainty you missed one. Calendars then answer the wrong question — they
show *when things are due*, never *what to work on today* or *what do I
need on the final*. We wanted the missing layer: a planner that understands
grade weights, respects your real hours, and — like GPS — recalculates
without drama when life happens.

## What it does

Drop in a syllabus (PDF, pasted text, or a public course link). An LLM
drafts every deadline, grading weight, and meeting time — but it is
**forbidden from guessing**: anything ambiguous ("Week of Nov 16", "TBD")
arrives flagged with the original wording, and you approve every row before
it counts. From there, everything is deterministic:

- **One timeline** across courses, each deadline sized by its true share of
  your grade; a workload heatmap of the painful weeks; one-click `.ics`
  export that lands cleanly in Google/Apple Calendar.
- **The Autopilot planner**: give it your weekly study hours and a pure
  scheduling engine spreads the work — weight × urgency, per-day caps,
  release windows. Tap **"I'm busy"** on any day and the plan visibly
  *reroutes*; when something genuinely no longer fits, it says so in plain
  language instead of silently overbooking you.
- **Grade what-if**: "you need 87 on the final for a 90" — with honest
  *already-secured* and *out-of-reach* states, and the real cost of
  skipping anything.

Local-first: no account, no database — your data lives in your browser,
exports as JSON, and even self-heals if the stored blob is corrupted.

## How we built it

Next.js 16 + TypeScript + Tailwind v4 on Vercel. The AI boundary is the
Vercel AI SDK with zod-constrained structured output against **any
OpenAI-compatible endpoint** — three env vars swap between Featherless,
or a completely free local Llama via Ollama (the demo video's extraction
runs on a laptop, offline). The scheduler is pure TypeScript over integer
half-hours — deterministic to the byte — with typed conflicts and stable
block keys that give the reroute its animation. Motion is compositor-only
and respects reduced-motion.

## Challenges we ran into

The honest ones were all found by testing the deployed product, not the
code: Tailwind v4 silently pruning theme variables used only in inline
styles (every timeline tick rendered transparent in production); AI SDK v7
rejecting system prompts inside `messages` — masked by our mock mode until
a real model hit it; animation-library contracts (`popLayout` requires ref
forwarding or exiting cards become zombies); and demo data that overloaded
the default availability into a wall of 16 red conflicts — fixed with a
tuning pass plus a permanent test that the demo stays presentable
*whichever weekday a judge clicks it*.

## Accomplishments we're proud of

- **514 unit tests run twice** — under `America/Chicago` and
  `Pacific/Kiritimati` (UTC+14) — because a calendar app that breaks at
  UTC+14 is broken; the scheduler holds 100% line coverage with 100-seed
  invariant fuzzing (no day over capacity, hours conserved, byte-identical
  reruns).
- **54 end-to-end runs** (18 Playwright specs × Chromium/Firefox/WebKit)
  against production builds, including corrupt-storage recovery and an
  **axe accessibility gate at zero critical/serious violations** on six
  surfaces — WCAG AA contrast enforced at the design-token level.
- A demo anyone can experience in ten seconds: date-shifted demo data means
  the live link always lands mid-semester, even with every API down.

## What we learned

Confine AI to where its mistakes are reviewable, and spend the saved
complexity on determinism everywhere else — trust is a feature. And test
the deployed thing: four of our worst bugs were invisible to a green local
suite.

## What's next

Share links for study groups, multi-semester archives, iCal subscription
feeds, PWA offline packaging, and OCR for scanned syllabi — all additive on
the local-first core. The seams are already in place.

## Built with

`next.js` `typescript` `tailwindcss` `zustand` `vercel-ai-sdk` `zod`
`motion` `pdf.js` `radix-ui` `firecrawl` `ollama` `playwright` `vitest`
`vercel`

## Sponsor tools used

- **Firecrawl** — course-page URL import (public pages → markdown → same
  review pipeline).
- **Featherless-ready** — the extraction layer is OpenAI-compatible by
  design; a Featherless key drops in via env vars with zero code changes
  (identical Llama model family to our local dev setup).
- Deployed on **Vercel**.

## AI usage disclosure

Runtime AI is limited to syllabus reading, always behind a human review
table. The codebase was built with AI pair-programming assistance; all code
is reviewed, typed, linted, and covered by the test suite above.
