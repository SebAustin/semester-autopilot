# YouTube upload

## Title
Semester Autopilot — GPS for your semester (ReverieHacks 2026 demo)

## Description

Every semester starts with a pile of syllabus PDFs and an evening of copying deadlines into a calendar — and the calendar still can't tell you what to work on today.

Semester Autopilot reads your syllabi, puts every deadline on one timeline sized by grade weight, and builds a study plan that reroutes itself — like GPS around traffic — when life happens.

▶ Try it live (no signup): https://semester-autopilot.vercel.app
💻 Source (MIT): https://github.com/SebAustin/semester-autopilot

The core idea: AI only where its mistakes are reviewable, deterministic code everywhere you act on the output. A language model drafts your deadlines and grading weights — but it is forbidden from guessing. "Week of Nov 16" and "Final exam: TBD" come back flagged with the original wording, and nothing enters your semester until you approve the row. Everything after that — the scheduler, the grade math, the calendar export — is pure, tested code that can't hallucinate.

The extraction in this video runs on a free Llama 3.1 model on my own laptop via Ollama, fully offline.

CHAPTERS
0:00 The problem: a pile of syllabi
0:15 One timeline, sized by grade weight
0:28 The AI reads a syllabus — and refuses to guess
0:53 The planner: your real study hours
1:06 The reroute: "I'm busy" and the plan reflows
1:19 Grade what-if: what do I need on the final?
1:29 Local-first, open source, offline

BUILT WITH
Next.js · TypeScript · Tailwind CSS · zustand · Vercel AI SDK + zod · Ollama · Firecrawl · Motion · pdf.js · Playwright · Vitest · deployed on Vercel

UNDER THE HOOD
· 514 unit tests, run under two timezones (a calendar app that breaks at UTC+14 is broken)
· The scheduler holds 100% line coverage, fuzz-tested across 100 random semesters
· 54 end-to-end runs across Chromium, Firefox and WebKit, including a zero-violation axe accessibility gate
· Local-first: no account, no database — your data stays in your browser and the planner works offline

Built solo for ReverieHacks 2026 (Software Development track).
Captions are burned in; an .srt is also available in the repo.

## Tags
semester autopilot, study planner, hackathon, reveriehacks, student productivity, syllabus parser, ai study planner, nextjs, typescript, ollama, local first, open source, devpost, study schedule, grade calculator

## Visibility
Unlisted is fine for Devpost — judges only need the link. Public if you want it discoverable.
