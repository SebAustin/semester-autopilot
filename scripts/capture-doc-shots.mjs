/**
 * Captures the documentation screenshot set into docs/media/.
 * Run against a local prod server started with LLM_MOCK=1:
 *   pnpm build && LLM_MOCK=1 pnpm start &
 *   node scripts/capture-doc-shots.mjs
 */
import { copyFileSync, mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";
mkdirSync("docs/media", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1360, height: 860 },
  deviceScaleFactor: 2,
});

// Review table (mock extraction via paste)
await page.goto(`${BASE}/app/ingest`);
await page
  .getByLabel(/paste the syllabus text/i)
  .fill(
    "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelims 30%, Final 25%, Project 15%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8. Final Exam TBD.",
  );
await page.getByRole("button", { name: "Extract deadlines" }).click();
await page.getByText(/review what the AI found/i).waitFor({ timeout: 20_000 });
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/media/review-table.png" });

// Demo data for the rest
await page.goto(`${BASE}/app`);
await page.getByRole("button", { name: /try with demo data/i }).click();
await page.getByRole("heading", { name: "This semester" }).waitFor();

// Grade panel
await page.getByRole("link", { name: /General Chemistry I/ }).click();
await page.getByRole("heading", { name: "Grade outlook" }).waitFor();
await page.waitForTimeout(400);
await page
  .locator("section[aria-label='Grade outlook']")
  .screenshot({ path: "docs/media/grade-panel.png" });

// Busy-state planner board
await page.goto(`${BASE}/app/planner`);
await page.getByRole("heading", { name: "Study plan" }).waitFor();
const loaded = page
  .locator("[data-date]")
  .filter({ has: page.getByTestId("study-block") })
  .first();
const date = await loaded.getAttribute("data-date");
await page
  .locator(`[data-date="${date}"]`)
  .getByRole("button", { name: /^Mark .* as busy$/ })
  .click();
await page.waitForTimeout(1400);
await page.screenshot({ path: "docs/media/reroute-busy.png" });

// Reuse landing-quality shots
for (const name of ["hero.png", "semester.png", "planner.png"]) {
  copyFileSync(`public/shots/${name}`, `docs/media/${name}`);
}

await browser.close();
process.stdout.write("docs/media/ updated\n");
