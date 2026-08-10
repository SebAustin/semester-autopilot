/**
 * Records the demo-video screen footage as ONE continuous 1080p take
 * following VIDEO-SCRIPT.md's beats. Cut/tighten in any editor; the
 * extraction wait is meant to be time-lapsed.
 *
 * Requires a prod server on :3000 with REAL extraction (Ollama configured,
 * LLM_MOCK unset):  pnpm build && pnpm start
 *
 *   node scripts/record-demo.mjs [outDir]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const OUT = resolve(process.argv[2] ?? "../video");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ slowMo: 120 });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();

// Beat 1 — landing
await page.goto("http://localhost:3000/");
await pause(2500);
await page.mouse.wheel(0, 700);
await pause(1800);
await page.mouse.wheel(0, 800);
await pause(1800);
await page.mouse.wheel(0, -1600);
await pause(1200);

// Beat 2 — demo semester
await page.getByRole("link", { name: "Open the app" }).click();
await pause(1200);
await page.getByRole("button", { name: /try with demo data/i }).click();
await page.getByRole("heading", { name: "This semester" }).waitFor();
await pause(2200);
const tick = page.getByTestId("timeline-tick").nth(12);
await tick.hover();
await pause(1600);
await page.getByTestId("timeline-tick").nth(20).hover();
await pause(1600);
await page.mouse.wheel(0, 420);
await pause(1800);
await page.mouse.wheel(0, -420);
await pause(800);

// Beat 3 — live extraction (real model on camera)
await page.getByRole("link", { name: "Add courses" }).click();
await pause(1000);
const syllabus = readFileSync("fixtures/cs-3110-syllabus.txt", "utf8");
await page.getByLabel(/paste the syllabus text/i).fill(syllabus);
await pause(1200);
await page.getByRole("button", { name: "Extract deadlines" }).click();
await page
  .getByText(/review what the AI found/i)
  .waitFor({ timeout: 120_000 }); // time-lapse this stretch in the edit
await pause(2500);
const needsDate = page.getByText(/needs a date/i).first();
await needsDate.scrollIntoViewIfNeeded();
await pause(2200);
await page.mouse.wheel(0, -300);
await pause(1000);
await page.getByRole("button", { name: /add to my semester/i }).click();
await page.getByRole("heading", { name: "This semester" }).waitFor();
await pause(2500);

// Beat 4 — .ics export
await page.getByRole("button", { name: "Export .ics" }).click();
await pause(1800);

// Beat 5 — planner
await page.getByRole("link", { name: "Planner" }).click();
await page.getByRole("heading", { name: "Study plan" }).waitFor();
await pause(2000);
const monday = page.getByRole("slider", { name: "Mon hours" });
await monday.focus();
await page.keyboard.press("ArrowUp");
await pause(500);
await page.keyboard.press("ArrowUp");
await pause(1600);
await page.mouse.wheel(0, 520);
await pause(2000);

// Beat 6 — THE reroute
const loaded = page
  .locator("[data-date]")
  .filter({ has: page.getByTestId("study-block") })
  .first();
const date = await loaded.getAttribute("data-date");
const cell = page.locator(`[data-date="${date}"]`);
await cell.scrollIntoViewIfNeeded();
await pause(900);
await cell.getByRole("button", { name: /^Mark .* as busy$/ }).click();
await pause(3200);
await page.mouse.wheel(0, -400);
await pause(1800); // conflict banner beat
await page.mouse.wheel(0, 400);
await cell.getByRole("button", { name: /^Unmark .* as busy$/ }).click();
await pause(2600);

// Beat 7 — grade what-if
await page.getByRole("link", { name: "Semester", exact: true }).click();
await pause(800);
await page.getByRole("link", { name: /General Chemistry I/ }).click();
await page.getByRole("heading", { name: "Grade outlook" }).waitFor();
await pause(2200);
const slider = page.getByRole("slider", { name: /What-if score for/ }).first();
await slider.focus();
for (let i = 0; i < 6; i += 1) {
  await page.keyboard.press("ArrowLeft");
  await pause(120);
}
await pause(2200);

// Beat 8 — close on the landing
await page.goto("http://localhost:3000/");
await pause(2600);

await context.close(); // flushes the video file
await browser.close();
process.stdout.write(`footage written to ${OUT}\n`);
