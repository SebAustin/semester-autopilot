/**
 * Records the demo as PER-BEAT clips (beat-1.webm … beat-8.webm) into
 * ../video/build/clips, plus a manifest of speed-ramp windows.
 *
 * One browser context is shared across beats so localStorage (demo data, the
 * added course, the busy day) carries forward. A synthetic cursor is injected
 * so the narration's "I tap" / "I drag" is actually visible — Playwright's
 * input is real DOM events, so the cursor follows automatically.
 *
 * Ramps are recorded in clip-time and applied later by assemble-demo.mjs:
 * the reroute gets slowed down so the reflow reads, and the model's thinking
 * time gets compressed so it isn't dead air.
 *
 * Server: pnpm build && pnpm start  (real extraction — Ollama configured)
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const OUT = resolve("../video/build/clips");
mkdirSync(OUT, { recursive: true });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Draws a pointer that follows real mouse events, plus a click ripple. */
function installCursor() {
  const install = () => {
    if (document.getElementById("__demo_cursor")) return;

    const cursor = document.createElement("div");
    cursor.id = "__demo_cursor";
    cursor.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 28 28">' +
      '<path d="M6 3 L6 21.5 L11.2 16.6 L14.7 24 L18.2 22.3 L14.8 15.1 L21.5 15 Z" ' +
      'fill="#ffffff" stroke="#14171f" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transform: "translate(-200px, -200px)",
      transition: "transform 80ms linear",
      filter: "drop-shadow(0 2px 5px rgba(0,0,0,.4))",
    });
    document.documentElement.appendChild(cursor);

    addEventListener(
      "mousemove",
      (event) => {
        cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      },
      true,
    );

    addEventListener(
      "mousedown",
      (event) => {
        const ripple = document.createElement("div");
        Object.assign(ripple.style, {
          position: "fixed",
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          width: "16px",
          height: "16px",
          marginLeft: "-8px",
          marginTop: "-8px",
          borderRadius: "999px",
          border: "3px solid rgba(37,99,235,.95)",
          zIndex: "2147483646",
          pointerEvents: "none",
        });
        document.documentElement.appendChild(ripple);
        ripple.animate(
          [
            { transform: "scale(0.4)", opacity: 1 },
            { transform: "scale(3.2)", opacity: 0 },
          ],
          { duration: 520, easing: "ease-out" },
        ).onfinish = () => ripple.remove();
      },
      true,
    );
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
}

const browser = await chromium.launch({ slowMo: 110 });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
await context.addInitScript(installCursor);

const manifest = {};

async function beat(name, run) {
  const page = await context.newPage();
  const startedAt = Date.now();
  const ramps = [];
  const mark = {
    /** Seconds since this clip started recording. */
    at: () => (Date.now() - startedAt) / 1000,
    /** factor > 1 slows the window down; < 1 speeds it up. */
    ramp: (start, end, factor) =>
      ramps.push({ start: Math.max(0, start), end, factor }),
  };

  await run(page, mark);

  const video = page.video();
  await page.close();
  renameSync(await video.path(), `${OUT}/${name}.webm`);
  manifest[name] = ramps;
  process.stdout.write(
    `${name} ✓${ramps.length ? `  (${ramps.length} ramp)` : ""}\n`,
  );
}

// 1 — landing: keep scrolling FORWARD so the opening visibly progresses
await beat("beat-1", async (page) => {
  await page.goto("http://localhost:3000/");
  await pause(2600);
  await page.mouse.move(960, 540);
  await page.mouse.wheel(0, 620);
  await pause(2500);
  await page.mouse.wheel(0, 760);
  await pause(2500);
  await page.mouse.wheel(0, 700);
  await pause(2600);
});

// 2 — demo semester + timeline
await beat("beat-2", async (page) => {
  await page.goto("http://localhost:3000/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await page.getByRole("heading", { name: "This semester" }).waitFor();
  await pause(2400);
  await page.getByTestId("timeline-tick").nth(12).hover();
  await pause(2200);
  await page.getByTestId("timeline-tick").nth(22).hover();
  await pause(2200);
  await page.mouse.wheel(0, 380);
  await pause(2600);
  await page.mouse.wheel(0, -380);
  await pause(1400);
});

// 3 — live extraction → review → commit.
//     The model's thinking time is real; it gets compressed in post.
await beat("beat-3", async (page, mark) => {
  await page.goto("http://localhost:3000/app/ingest");
  await pause(1200);
  const syllabus = readFileSync("fixtures/cs-3110-syllabus.txt", "utf8");
  await page.getByLabel(/paste the syllabus text/i).fill(syllabus);
  await pause(1300);

  await page.getByRole("button", { name: "Extract deadlines" }).click();
  const waitStart = mark.at();
  await page.getByText(/review what the AI found/i).waitFor({ timeout: 120_000 });
  const waitEnd = mark.at();
  // Hold ~1.2s of the progress stepper, then time-lapse the rest away.
  if (waitEnd - waitStart > 3) {
    mark.ramp(waitStart + 1.2, waitEnd - 0.3, 0.16);
  }

  await pause(2600);
  await page.getByText(/needs a date/i).first().scrollIntoViewIfNeeded();
  await pause(2800);
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
  await pause(2800);
});

// 5 — planner
await beat("beat-5", async (page) => {
  await page.goto("http://localhost:3000/app/planner");
  await page.getByRole("heading", { name: "Study plan" }).waitFor();
  await pause(2400);
  const monday = page.getByRole("slider", { name: "Mon hours" });
  await monday.hover(); // put the cursor on the control before driving it
  await monday.focus();
  await page.keyboard.press("ArrowUp");
  await pause(700);
  await page.keyboard.press("ArrowUp");
  await pause(1900);
  await page.mouse.wheel(0, 540);
  await pause(3200);
  await page.mouse.wheel(0, -540);
  await pause(1400);
});

// 6 — THE reroute. Tight holds; the reflow itself is slowed down in post.
await beat("beat-6", async (page, mark) => {
  await page.goto("http://localhost:3000/app/planner");
  await page.getByRole("heading", { name: "Study plan" }).waitFor();
  await page.mouse.wheel(0, 500);
  await pause(1600);

  const loaded = page
    .locator("[data-date]")
    .filter({ has: page.getByTestId("study-block") })
    .first();
  const date = await loaded.getAttribute("data-date");
  const cell = page.locator(`[data-date="${date}"]`);
  const busyButton = cell.getByRole("button", { name: /^Mark .* as busy$/ });
  await busyButton.hover();
  await pause(500);

  const clickAt = mark.at();
  await busyButton.click();
  await pause(1500);
  // Stretch the reflow itself — this is the one moment that must read.
  mark.ramp(clickAt - 0.15, clickAt + 1.45, 2.6);

  await pause(1600);
  await page.mouse.wheel(0, -520);
  await pause(2600); // conflict banners
  await page.mouse.wheel(0, 300);
  await pause(1600);
});

// 7 — grade what-if
await beat("beat-7", async (page) => {
  await page.goto("http://localhost:3000/app");
  await page.getByRole("link", { name: /General Chemistry I/ }).click();
  await page.getByRole("heading", { name: "Grade outlook" }).waitFor();
  await pause(2400);
  const slider = page.getByRole("slider", { name: /What-if score for/ }).first();
  await slider.hover();
  await slider.focus();
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("ArrowLeft");
    await pause(150);
  }
  await pause(2400);
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press("ArrowRight");
    await pause(150);
  }
  await pause(1800);
});

// 8 — close on the landing's honesty band
await beat("beat-8", async (page) => {
  await page.goto("http://localhost:3000/");
  await pause(2000);
  await page.mouse.move(960, 540);
  await page.mouse.wheel(0, 2400);
  await pause(1800);
  await page
    .getByRole("heading", { name: /AI you can check/i })
    .scrollIntoViewIfNeeded();
  await pause(3400);
  await page.mouse.wheel(0, 700);
  await pause(2200);
});

await context.close();
await browser.close();

writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
process.stdout.write("all clips recorded → clips/manifest.json\n");
