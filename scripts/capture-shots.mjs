/**
 * Captures product screenshots (landing hero + README) from a running
 * instance with demo data loaded.
 *
 *   node scripts/capture-shots.mjs [baseUrl]   (default: production)
 */
import { mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "https://semester-autopilot.vercel.app";
mkdirSync("public/shots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1360, height: 860 },
  deviceScaleFactor: 2,
});

await page.goto(`${base}/app`);
await page.getByRole("button", { name: /try with demo data/i }).click();
await page.getByRole("heading", { name: "This semester" }).waitFor();
await page.waitForTimeout(600);

const semesterView = page.locator("main > div");
await semesterView.screenshot({
  path: "public/shots/semester.png",
  animations: "disabled",
});

// Landing hero: app chrome + timeline + heatmap only.
await page.screenshot({
  path: "public/shots/hero.png",
  animations: "disabled",
  clip: { x: 0, y: 0, width: 1360, height: 690 },
});

await page.getByRole("link", { name: "Planner" }).click();
await page.getByRole("heading", { name: "Study plan" }).waitFor();
await page.waitForTimeout(600);
await page.locator("main > div").screenshot({
  path: "public/shots/planner.png",
  animations: "disabled",
});

await browser.close();
process.stdout.write("captured public/shots/{semester,planner}.png\n");
