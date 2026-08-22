/**
 * Captures the Devpost image gallery — six 3:2 shots at 1500x1000 (2x),
 * the ratio Devpost recommends, framed by scrolling to the right spot
 * rather than cropping a full-page capture.
 *
 * Server: pnpm build && LLM_MOCK=1 pnpm start
 *   node scripts/capture-gallery.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "devpost/gallery";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1500, height: 1000 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const shot = (name) =>
  page.screenshot({ path: `${OUT}/${name}.png`, animations: "disabled" });

// Seed the demo semester once; it persists for the rest of the session.
await page.goto(`${BASE}/app`);
await page.getByRole("button", { name: /try with demo data/i }).click();
await page.getByRole("heading", { name: "This semester" }).waitFor();
await page.waitForTimeout(700);

// 1 — the signature view: timeline + heatmap
await shot("01-timeline");

// 2 — landing / the pitch
await page.goto(`${BASE}/`);
await page.waitForTimeout(900);
await shot("02-landing");

// 3 — review table (AI honesty). Mock extraction keeps this deterministic.
await page.goto(`${BASE}/app/ingest`);
await page
  .getByLabel(/paste the syllabus text/i)
  .fill(
    "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelim 1 15%, Prelim 2 15%, Final Exam 25%, Programming Project 10%, Participation 5%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8. Final Exam: date TBD.",
  );
await page.getByRole("button", { name: "Extract deadlines" }).click();
await page.getByText(/review what the AI found/i).waitFor({ timeout: 30_000 });
await page.waitForTimeout(600);
await page.mouse.wheel(0, 620); // bring the flagged rows into frame
await page.waitForTimeout(500);
await shot("03-review");

// 4 — planner board
await page.goto(`${BASE}/app/planner`);
await page.getByRole("heading", { name: "Study plan" }).waitFor();
await page.waitForTimeout(700);
await shot("04-planner");

// 5 — the reroute: a day marked busy, conflicts surfaced
const loaded = page
  .locator("[data-date]")
  .filter({ has: page.getByTestId("study-block") })
  .first();
const date = await loaded.getAttribute("data-date");
await page
  .locator(`[data-date="${date}"]`)
  .getByRole("button", { name: /^Mark .* as busy$/ })
  .click();
await page.waitForTimeout(1600);
await shot("05-reroute");

// 6 — grade what-if
await page.goto(`${BASE}/app`);
await page.getByRole("link", { name: /General Chemistry I/ }).click();
await page.getByRole("heading", { name: "Grade outlook" }).waitFor();
await page.waitForTimeout(700);
await shot("06-grades");

await browser.close();
process.stdout.write("gallery captured → devpost/gallery/\n");
