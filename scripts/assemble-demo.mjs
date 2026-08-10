/**
 * Assembles the final voiced demo video from ../video/build/clips/beat-N.webm
 * and ../video/build/nN.aiff narration:
 *   - fits each clip to its narration (speed-up if long, freeze-frame if short)
 *   - muxes narration (350ms lead-in), renders an end card, concats to MP4
 *
 *   node scripts/assemble-demo.mjs
 * Output: ../video/semester-autopilot-demo.mp4
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const BUILD = resolve("../video/build");
const SEG = `${BUILD}/segments`;
mkdirSync(SEG, { recursive: true });

const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args]);
const probe = (file) =>
  parseFloat(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
    ]).toString(),
  );

const ENC = [
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
  "-r", "30", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
];

// ---- end card ----
const endcardHtml = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;background:oklch(97.8% .005 95);color:oklch(22% .015 265);font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px}
h1{font-family:Fraunces,serif;font-weight:500;font-size:120px;letter-spacing:-.02em}
.url{font-size:44px;font-weight:600;color:oklch(54% .22 262)}
.sub{font-size:30px;color:oklch(44% .02 265)}</style></head><body>
<svg width="120" height="120" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="oklch(54% 0.22 262)"/><path d="M7 24 L12.5 24 C15.5 24 15.5 20.5 12.8 17.8 C10 15 10 10 14.5 10 L25 10" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="7" cy="24" r="2.7" fill="white"/><circle cx="25" cy="10" r="2.7" fill="white"/></svg>
<h1>Your semester, on autopilot.</h1>
<p class="url">semester-autopilot.vercel.app</p>
<p class="sub">github.com/SebAustin/semester-autopilot · MIT · Built solo for ReverieHacks 2026</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.setContent(endcardHtml, { waitUntil: "networkidle" });
await page.screenshot({ path: `${BUILD}/endcard.png` });
await browser.close();

// ---- fit + mux each beat ----
const LEAD_MS = 350;
const TAIL_S = 0.35;
for (let n = 1; n <= 8; n += 1) {
  const clip = `${BUILD}/clips/beat-${n}.webm`;
  const audio = `${BUILD}/n${n}.aiff`;
  const dv = probe(clip);
  const target = probe(audio) + LEAD_MS / 1000 + TAIL_S;
  const videoFilter =
    dv >= target
      ? `setpts=PTS*${(target / dv).toFixed(5)},fps=30`
      : `fps=30,tpad=stop_mode=clone:stop_duration=${(target - dv).toFixed(3)}`;
  ff([
    "-i", clip, "-i", audio,
    "-filter_complex",
    `[0:v]${videoFilter}[v];[1:a]adelay=${LEAD_MS}|${LEAD_MS},apad[a]`,
    "-map", "[v]", "-map", "[a]", "-t", target.toFixed(3),
    ...ENC, `${SEG}/seg-${n}.mp4`,
  ]);
  process.stdout.write(`seg-${n} ${dv.toFixed(1)}s → ${target.toFixed(1)}s\n`);
}

// ---- end card segment (4.5s, silent) ----
ff([
  "-loop", "1", "-t", "4.5", "-i", `${BUILD}/endcard.png`,
  "-f", "lavfi", "-t", "4.5", "-i", "anullsrc=r=48000:cl=stereo",
  ...ENC, `${SEG}/seg-9.mp4`,
]);

// ---- concat ----
writeFileSync(
  `${SEG}/list.txt`,
  Array.from({ length: 9 }, (_, i) => `file 'seg-${i + 1}.mp4'`).join("\n"),
);
ff([
  "-f", "concat", "-safe", "0", "-i", `${SEG}/list.txt`,
  "-c", "copy", resolve("../video/semester-autopilot-demo.mp4"),
]);

process.stdout.write(
  `done → ../video/semester-autopilot-demo.mp4 (${probe(resolve("../video/semester-autopilot-demo.mp4")).toFixed(1)}s)\n`,
);
