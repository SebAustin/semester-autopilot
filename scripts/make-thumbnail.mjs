/**
 * Renders devpost/thumbnail.png — 1200x800 (3:2), the ratio Devpost
 * recommends for gallery cards. Big type so it survives being shown small,
 * over a strip of the real product.
 *
 *   node scripts/make-thumbnail.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const shot = readFileSync(resolve("public/shots/hero.png")).toString("base64");

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:800px;overflow:hidden;background:oklch(97.8% .005 95);
    color:oklch(22% .015 265);font-family:Inter,sans-serif;
    display:flex;flex-direction:column;align-items:center;padding:58px 64px 0}
  .kicker{margin-top:20px;font-size:23px;font-weight:600;letter-spacing:.2em;
    text-transform:uppercase;color:oklch(54% .22 262)}
  h1{margin-top:18px;font-family:Fraunces,serif;font-weight:500;font-size:84px;
    line-height:1.02;letter-spacing:-.02em;text-align:center}
  .sub{margin-top:20px;font-size:26px;color:oklch(44% .02 265);text-align:center}
  .shot{margin-top:44px;width:1010px;height:250px;overflow:hidden;
    border:1px solid oklch(89% .008 95);border-top-left-radius:16px;
    border-top-right-radius:16px;box-shadow:0 -18px 50px -22px rgba(0,0,0,.28)}
  .shot img{width:100%;display:block;object-fit:cover;object-position:top}
</style></head><body>
  <svg width="88" height="88" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="oklch(54% 0.22 262)"/><path d="M7 24 L12.5 24 C15.5 24 15.5 20.5 12.8 17.8 C10 15 10 10 14.5 10 L25 10" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="7" cy="24" r="2.7" fill="white"/><circle cx="25" cy="10" r="2.7" fill="white"/></svg>
  <p class="kicker">Semester Autopilot</p>
  <h1>Your semester,<br>on autopilot.</h1>
  <p class="sub">Syllabi in → one timeline, a grade-aware plan that reroutes.</p>
  <div class="shot"><img src="data:image/png;base64,${shot}"></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "devpost/thumbnail.png" });
await browser.close();
process.stdout.write("wrote devpost/thumbnail.png\n");
