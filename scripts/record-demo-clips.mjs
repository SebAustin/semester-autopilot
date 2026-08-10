/**
 * Records the demo as PER-BEAT clips (beat-1.webm … beat-8.webm) into
 * ../video/build/clips. One browser context is shared across beats so
 * localStorage (demo data, added course, busy day) carries forward.
 *
 * Server: pnpm build && pnpm start  (real extraction — Ollama configured)
 */
import { mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const OUT = resolve("../video/build/clips");
mkdirSync(OUT, { recursive: true });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ slowMo: 110 });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});

async function beat(name, run) {
  const page = await context.newPage();
  await run(page);
  const video = page.video();
  await page.close();
  const raw = await video.path();
  renameSync(raw, `${OUT}/${name}.webm`);
  process.stdout.write(`${name} ✓\n`);
}

// 1 — landing
await beat("beat-1", async (page) => {
  await page.goto("http://localhost:3000/");
  await pause(2600);
  await page.mouse.wheel(0, 700);
  await pause(2600);
  await page.mouse.wheel(0, 900);
  await pause(2600);
  await page.mouse.wheel(0, -1600);
  await pause(2400);
});

// 2 — demo semester + timeline
await beat("beat-2", async (page) => {
  await page.goto("http://localhost:3000/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await page.getByRole("heading", { name: "This semester" }).waitFor();
  await pause(2600);
  await page.getByTestId("timeline-tick").nth(12).hover();
  await pause(2200);
  await page.getByTestId("timeline-tick").nth(22).hover();
  await pause(2200);
  await page.mouse.wheel(0, 380);
  await pause(2600);
  await page.mouse.wheel(0, -380);
  await pause(1600);
});

// 3 — live extraction → review → commit
await beat("beat-3", async (page) => {
  await page.goto("http://localhost:3000/app/ingest");
  await pause(1200);
  const { readFileSync } = await import("node:fs");
  const syllabus = readFileSync("fixtures/cs-3110-syllabus.txt", "utf8");
  await page.getByLabel(/paste the syllabus text/i).fill(syllabus);
  await pause(1400);
  await page.getByRole("button", { name: "Extract deadlines" }).click();
  await page.getByText(/review what the AI found/i).waitFor({ timeout: 120_000 });
  await pause(2600);
  await page.getByText(/needs a date/i).first().scrollIntoViewIfNeeded();
  await pause(2600);
  await page.mouse.wheel(0, -400);
  await pause(1400);
  await page.getByRole("button", { name: /add to my semester/i }).click();
  await page.getByRole("heading", { name: "This semester" }).waitFor();
  await pause(2600);
});

// 4 — .ics export
await beat("beat-4", async (page) => {
  await page.goto("http://localhost:3000/app");
  await page.getByRole("heading", { name: "This semester" }).waitFor();
  await pause(1200);
  await page.getByRole("button", { name: "Export .ics" }).click();
  await pause(3000);
});

// 5 — planner
await beat("beat-5", async (page) => {
  await page.goto("http://localhost:3000/app/planner");
  await page.getByRole("heading", { name: "Study plan" }).waitFor();
  await pause(2400);
  const monday = page.getByRole("slider", { name: "Mon hours" });
  await monday.focus();
  await page.keyboard.press("ArrowUp");
  await pause(600);
  await page.keyboard.press("ArrowUp");
  await pause(2000);
  await page.mouse.wheel(0, 540);
  await pause(3400);
  await page.mouse.wheel(0, -540);
  await pause(1600);
});

// 6 — THE reroute (ends on the conflict, no undo)
await beat("beat-6", async (page) => {
  await page.goto("http://localhost:3000/app/planner");
  await page.getByRole("heading", { name: "Study plan" }).waitFor();
  await page.mouse.wheel(0, 500);
  await pause(1400);
  const loaded = page
    .locator("[data-date]")
    .filter({ has: page.getByTestId("study-block") })
    .first();
  const date = await loaded.getAttribute("data-date");
  const cell = page.locator(`[data-date="${date}"]`);
  await cell.getByRole("button", { name: /^Mark .* as busy$/ }).click();
  await pause(3600);
  await page.mouse.wheel(0, -520);
  await pause(3400); // hold the conflict banner
  await page.mouse.wheel(0, 300);
  await pause(2200);
});

// 7 — grade what-if
await beat("beat-7", async (page) => {
  await page.goto("http://localhost:3000/app");
  await page.getByRole("link", { name: /General Chemistry I/ }).click();
  await page.getByRole("heading", { name: "Grade outlook" }).waitFor();
  await pause(2600);
  const slider = page.getByRole("slider", { name: /What-if score for/ }).first();
  await slider.focus();
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("ArrowLeft");
    await pause(160);
  }
  await pause(2600);
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press("ArrowRight");
    await pause(160);
  }
  await pause(2000);
});

// 8 — close on landing (honesty band)
await beat("beat-8", async (page) => {
  await page.goto("http://localhost:3000/");
  await pause(2200);
  await page.mouse.wheel(0, 2400);
  await pause(1800);
  await page
    .getByRole("heading", { name: /AI you can check/i })
    .scrollIntoViewIfNeeded();
  await pause(3200);
  await page.mouse.wheel(0, -3200);
  await pause(2600);
});

await context.close();
await browser.close();
process.stdout.write("all clips recorded\n");
