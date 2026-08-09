# Semester Autopilot

**GPS for your semester.** Drop in your syllabi — get every deadline on one
timeline, a grade-aware study plan, and a schedule that reroutes itself when
life happens.

Built solo for [ReverieHacks 2026](https://reveriehacks.org) (Software
Development track).

## Why

Every semester, students hand-transcribe 4–6 syllabus PDFs into calendars,
miss buried deadlines anyway, and have no idea which assignment actually
moves their grade. Semester Autopilot does the transcription with AI you can
correct, then plans the work with a deterministic engine you can trust:

- **Ingest** — upload a syllabus PDF (or paste text / a course URL). An LLM
  extracts deadlines, grading weights, and meeting times into a review table.
  You confirm; nothing enters your semester unreviewed.
- **Semester view** — one timeline across all courses, workload heatmap, and
  one-click `.ics` export to Google/Apple Calendar.
- **Autopilot planner** — set your weekly hours; a deterministic scheduler
  spreads the work by grade weight and urgency. Miss a day, and your plan
  visibly *reroutes* — like GPS.
- **Grade what-if** — "what happens if I skip this?" and "what do I need on
  the final?", weighted correctly.

**Local-first**: your data lives in your browser. No account, no database.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · zustand · Vercel AI SDK
(Featherless.AI, OpenAI-compatible) · Firecrawl · Motion · deployed on Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # add your keys (see below)
pnpm dev
```

Runs at http://localhost:3000. Without keys, set `LLM_MOCK=1` to use fixture
extraction responses — everything except live LLM calls works offline.

### Environment

| Variable | Purpose |
| --- | --- |
| `LLM_BASE_URL` | OpenAI-compatible endpoint (e.g. `https://api.featherless.ai/v1`) |
| `LLM_API_KEY` | API key for that endpoint |
| `LLM_MODEL_ID` | Model id (e.g. `meta-llama/Meta-Llama-3.1-70B-Instruct`) |
| `FIRECRAWL_API_KEY` | Course-page URL import (optional) |
| `LLM_MOCK` | `1` = fixture extraction, no network (used by e2e) |

### Scripts

```bash
pnpm test        # unit tests (runs twice: America/Chicago + Pacific/Kiritimati)
pnpm coverage    # unit tests + v8 coverage
pnpm e2e         # Playwright happy path (builds first, LLM_MOCK=1)
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
```

## License

[MIT](./LICENSE) © 2026 Sebastien Henry
