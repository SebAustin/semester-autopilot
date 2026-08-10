/** Renders public/og.png (1200×630) from an inline HTML template. */
import { chromium } from "@playwright/test";

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: oklch(97.8% 0.005 95); color: oklch(22% 0.015 265);
    font-family: Inter, sans-serif; padding: 72px 80px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .kicker { display: flex; align-items: center; gap: 16px; }
  .kicker span {
    font-size: 22px; font-weight: 600; letter-spacing: .22em;
    text-transform: uppercase; color: oklch(54% 0.22 262);
  }
  h1 {
    font-family: Fraunces, serif; font-weight: 500;
    font-size: 108px; line-height: .98; letter-spacing: -0.02em;
    margin-top: 40px;
  }
  .sub { margin-top: 34px; font-size: 30px; line-height: 1.45; color: oklch(44% 0.02 265); max-width: 900px; }
  .foot { display: flex; justify-content: space-between; align-items: baseline; font-size: 22px; color: oklch(60% 0.015 265); }
  .foot b { color: oklch(22% 0.015 265); font-weight: 600; }
</style></head>
<body>
  <div>
    <div class="kicker">
      <svg width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="oklch(54% 0.22 262)"/><path d="M7 24 L12.5 24 C15.5 24 15.5 20.5 12.8 17.8 C10 15 10 10 14.5 10 L25 10" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="7" cy="24" r="2.7" fill="white"/><circle cx="25" cy="10" r="2.7" fill="white"/></svg>
      <span>Semester Autopilot</span>
    </div>
    <h1>Your semester,<br>on autopilot.</h1>
    <p class="sub">Syllabi in → every deadline on one timeline, a grade-aware study plan, and a schedule that reroutes when life happens.</p>
  </div>
  <div class="foot">
    <p><b>semester-autopilot.vercel.app</b> · free · no signup</p>
    <p>ReverieHacks 2026</p>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "public/og.png" });
await browser.close();
process.stdout.write("wrote public/og.png\n");
