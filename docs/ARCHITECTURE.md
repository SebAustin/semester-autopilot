# Architecture

The organizing principle: **AI only where its mistakes are reviewable;
deterministic code everywhere the user acts on the output.** The LLM touches
exactly one boundary (reading a syllabus, behind a human review table).
Everything a user clicks live — scheduling, grades, calendar export — is
pure, tested TypeScript that cannot flake, hallucinate, or rate-limit.

## System shape

```
Browser (all state lives here)
├── zustand + localStorage  ← courses, deliverables, availability
│     └── derived Plan = buildPlan(state)   (recomputed, never stored)
├── pdf.js (dynamic import) ← PDF → text, client-side
└── two stateless API routes (the entire server surface)
      ├── POST /api/extract   text → structured syllabus  (LLM)
      └── POST /api/scrape    public URL → markdown       (Firecrawl)
```

No database, no auth, no sessions. Judges/users get full functionality from
`localStorage` + static hosting; the two routes only hold the API keys
server-side.

## Domain model (`src/lib/types.ts`)

- `Course` — grading categories (weights), meeting times, one of six
  identity hues
- `Deliverable` — type, due date, optional explicit weight, estimated hours
  (type-based defaults, user-editable), status (`pending | done | skipped`),
  score
- `UserAvailability` — weekly hours per weekday + blackout dates (the
  reroute trigger)
- `Plan` — **derived, never persisted**: study blocks + typed conflicts +
  stats, recomputed via a memoized selector on every relevant change

**Dates are `ISODate` strings (`YYYY-MM-DD`) everywhere.** Raw `Date`
arithmetic exists only inside `lib/dates/iso.ts` (UTC-component math);
`today` is injected into every computation. The unit suite runs twice —
`America/Chicago` and `Pacific/Kiritimati` (UTC+14) — so any local/UTC mixup
fails loudly.

## Extraction pipeline (`lib/extraction`, `/api/extract`)

1. **Preprocess** — strip boilerplate, cap length, keep date/percent-dense
   lines when over budget.
2. **LLM call** — `generateObject` (Vercel AI SDK) with a zod schema against
   any OpenAI-compatible endpoint (three env vars; `LLM_STRUCTURED=1` turns
   on `json_schema` constrained decoding — required for reliable adherence
   from small local models). System prompt hard rules: *never invent a date;
   copy the verbatim deadline text into `dueDateRaw`; per-row `confidence`.*
3. **Repair retry** — one schema-guided correction attempt, then an honest
   422 with a manual-entry path.
4. **Normalize (pure, tested)** — date coercion, weight clamping with
   warnings, dedupe, effort defaults; null-dated rows land in a visible
   "needs a date" bucket instead of being dropped.
5. **Review table** — low-confidence rows highlighted amber with the source
   text; the user edits/approves before anything is committed. Category
   matching (`lib/grades/match.ts`) heuristically links rows to grading
   categories ("PS1" → *Problem Sets*) so derived weights work on real
   syllabi, with a score threshold that prefers no guess over a wrong one.

## Scheduler (`lib/scheduler`) — the differentiator

Greedy forward-fill over **integer half-hours** (float drift is impossible
by construction):

- Per task: `release = dueDate − startWindow(type)` (projects open 14 days
  out, quizzes 4), `importance = 1 + effectiveWeight/10`, per-day caps by
  type (deep work may take 3h bites, homework 2h).
- Day by day: pick `argmax urgency × importance` where `urgency = remaining ÷
  hours still available before its deadline` — a task running out of runway
  automatically dominates. Ties break deterministically (deadline → weight →
  id).
- What can't fit becomes **typed conflicts** with deterministic copy:
  *past-due*, *"X won't fully fit — 2h unplaced before Aug 14"*,
  *"Week of Aug 10 is 5h over capacity."* The engine never silently
  overbooks.
- **Reroute = full recompute + animated diff.** Same inputs → byte-identical
  plan (fuzz-verified), so recompute-on-every-change is free (<1ms) and the
  stable block keys (`taskId#n`) give the UI its animation identity.

Verified by 42 edge-case tests plus 100 seeded random semesters asserting:
no day over capacity, every block inside `[release, deadline]`, per-day caps
respected, `placed + shortfall = estimate` for every task, byte-identical
reruns. 100% line coverage.

## Grades (`lib/grades`)

`effectiveWeight` = explicit syllabus weight ?? category weight ÷ items in
category (never invented — unknown weight renders small, counts zero).
Projections normalize against total modeled weight, so syllabi whose weights
don't sum to 100 still behave. Skipped = scored 0; done-without-score stays
ungraded. `neededOn` solves the classic "what do I need on the final",
clamped to honest *already-secured* / *out-of-reach* states.

## Calendar export (`lib/ics`)

All-day `VALUE=DATE` VEVENTs — a deadline is a calendar day, and date-only
events carry **no timezone**, eliminating that bug class. RFC 5545 text
escaping, 75-octet line folding (byte-aware, multi-byte safe), stable UIDs,
CRLF discipline. Snapshot + property tests.

## Motion & accessibility

Compositor-only animation (transform/opacity), `MotionConfig
reducedMotion="user"` plus a global CSS reduced-motion kill switch. Contrast
is enforced at the token level (text-safe `-strong`/`-text` variants beside
decorative hues); an axe-core gate in CI keeps six surfaces at zero
critical/serious violations, including the busy/conflict states.

## Testing philosophy

- Pure logic (`lib/**`) gets exhaustive unit tests — it's where correctness
  lives.
- UI gets **one honest end-to-end path per feature** against a production
  build (18 specs × 3 browsers), plus visual/overflow sweeps at 320–1440px.
- The demo dataset itself is tested: whichever weekday a judge clicks "try
  demo data", the plan must present ≤3 conflicts and no red wall.

## Hard-won implementation notes

- Tailwind v4 prunes `@theme` variables not referenced by compiled utilities
  — hues consumed via inline `style` need `@theme static`.
- AI SDK v7 moved system prompts out of `messages` into `instructions`.
- `AnimatePresence popLayout` requires custom children to forward refs, or
  exiting cards never unmount.
- Ollama: use `127.0.0.1` (Node resolves `localhost` to IPv6), bump
  `num_ctx` (default silently truncates syllabi), and prefer constrained
  decoding.
