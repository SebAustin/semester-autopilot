/**
 * Assembles the final demo video from ../video/build/clips/beat-N.webm and
 * ../video/build/nN.aiff narration.
 *
 *   title card → 8 narrated beats → end card
 *   · each beat is duration-fitted to its narration (speed-up / freeze-frame)
 *   · captions generated from the narration text with proportional cue timing
 *   · audio mastered to EBU R128 (-16 LUFS, web standard)
 *
 * Outputs to ../video/:
 *   semester-autopilot-demo.mp4             captions burned in (upload-safe)
 *   semester-autopilot-demo-nocaptions.mp4  clean video
 *   captions.srt                            sidecar (YouTube/Devpost)
 *
 *   node scripts/assemble-demo.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const BUILD = resolve("../video/build");
const SEG = `${BUILD}/segments`;
const OUT = resolve("../video");
mkdirSync(SEG, { recursive: true });

const ff = (args, opts = {}) =>
  execFileSync("ffmpeg", ["-y", "-v", "error", ...args], opts);
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

const LEAD_S = 0.28; // silence before narration starts in each beat
const TAIL_S = 0.22; // breathing room after it ends (kept tight: the pads of
                     // adjacent beats stack into one gap at every cut)
const TITLE_S = 3.0;
const ENDCARD_S = 3.2;
/** Past this, stretching the picture reads worse than holding a frame. */
const MAX_STRETCH = 1.35;

/** Narration text per beat — must match video/build/narration.sh verbatim. */
const NARRATION = [
  "Every semester starts the same way. A pile of syllabus PDFs, and an evening of copying deadlines into a calendar, hoping you didn't miss one. Semester Autopilot is GPS for your semester.",
  "This is a semester at a glance. Three courses, every deadline on one timeline, each dot sized by how much it actually moves your grade. Exams are diamonds. And the heatmap below shows the weeks that will hurt.",
  "Adding a course is one paste. A language model, here a completely free one running locally, reads the syllabus and drafts every deadline and grading weight. But here is the important part. It is not allowed to guess. Final exam, date TBD? It comes back flagged, with the original wording, waiting for me. I approve every row before anything counts.",
  "One click, and every deadline is in my real calendar.",
  "Now, the part no calendar app does. I tell Autopilot the hours I can study, and a deterministic engine spreads the work. Heavier weights and closer deadlines come first, capped so no day is crammed.",
  "And when life happens, I just tap, I'm busy. Watch. The whole plan reroutes, like GPS around traffic. And because it never silently overbooks me, it tells me exactly what no longer fits.",
  "It even answers the question every student asks. What do I need on the final? Drag a what-if, watch the projection move, and see what skipping something really costs.",
  "No accounts. Your data never leaves the browser. Free, open source, and fully offline capable. Semester Autopilot. Your semester, on autopilot.",
];

/* ---------------------------------- cards --------------------------------- */

const CARD_HEAD = `<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}
body{width:1920px;height:1080px;background:oklch(97.8% .005 95);color:oklch(22% .015 265);
font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;
justify-content:center;gap:34px}
h1{font-family:Fraunces,serif;font-weight:500;letter-spacing:-.02em}
.kicker{font-size:30px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:oklch(54% .22 262)}
.url{font-size:44px;font-weight:600;color:oklch(54% .22 262)}
.sub{font-size:30px;color:oklch(44% .02 265)}</style>`;

const LOGO = `<svg width="120" height="120" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="oklch(54% 0.22 262)"/><path d="M7 24 L12.5 24 C15.5 24 15.5 20.5 12.8 17.8 C10 15 10 10 14.5 10 L25 10" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="7" cy="24" r="2.7" fill="white"/><circle cx="25" cy="10" r="2.7" fill="white"/></svg>`;

const CARDS = {
  title: `<!doctype html><html><head>${CARD_HEAD}</head><body>
    ${LOGO}
    <p class="kicker">Semester Autopilot</p>
    <h1 style="font-size:104px">GPS for your semester.</h1>
    <p class="sub">ReverieHacks 2026 · Software Development</p>
  </body></html>`,
  endcard: `<!doctype html><html><head>${CARD_HEAD}</head><body>
    ${LOGO}
    <h1 style="font-size:120px">Your semester, on autopilot.</h1>
    <p class="url">semester-autopilot.vercel.app</p>
    <p class="sub">github.com/SebAustin/semester-autopilot · MIT · Built solo for ReverieHacks 2026</p>
  </body></html>`,
};

async function renderCards() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const [name, html] of Object.entries(CARDS)) {
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${BUILD}/${name}.png` });
  }
  await browser.close();
}

const VENC = [
  "-c:v", "libx264", "-preset", "medium", "-crf", "20",
  "-pix_fmt", "yuv420p", "-r", "30", "-an",
];

/**
 * Applies the recorder's speed ramps: the reroute is stretched so the reflow
 * is visible, the model's thinking time is compressed so it isn't dead air.
 * Everything outside a ramp window plays at natural speed.
 */
function shapeClip(input, ramps, outFile) {
  if (!ramps || ramps.length === 0) return input;

  const duration = probe(input);
  const parts = [];
  let cursor = 0;
  for (const ramp of [...ramps].sort((a, b) => a.start - b.start)) {
    const start = Math.max(cursor, Math.min(ramp.start, duration));
    const end = Math.max(start, Math.min(ramp.end, duration));
    if (start > cursor) parts.push({ start: cursor, end: start, factor: 1 });
    if (end > start) parts.push({ start, end, factor: ramp.factor });
    cursor = end;
  }
  if (cursor < duration) parts.push({ start: cursor, end: duration, factor: 1 });

  const trims = parts
    .map(
      (part, i) =>
        `[0:v]trim=start=${part.start.toFixed(3)}:end=${part.end.toFixed(3)},` +
        `setpts=(PTS-STARTPTS)*${part.factor}[p${i}]`,
    )
    .join(";");
  const joined = parts.map((_, i) => `[p${i}]`).join("");

  ff([
    "-i", input,
    "-filter_complex",
    `${trims};${joined}concat=n=${parts.length}:v=1:a=0[v]`,
    "-map", "[v]", ...VENC, outFile,
  ]);
  return outFile;
}

function stillSegment(png, seconds, outFile) {
  ff([
    "-loop", "1", "-t", String(seconds), "-i", png,
    "-f", "lavfi", "-t", String(seconds), "-i", "anullsrc=r=48000:cl=stereo",
    ...ENC, outFile,
  ]);
}

/* -------------------------------- captions -------------------------------- */

const MAX_CUE_CHARS = 84;
const MAX_LINE_CHARS = 44;

/** Greedily pack parts into cues, never exceeding the cue budget. */
function packParts(parts, budget) {
  const packed = [];
  let current = "";
  for (const part of parts) {
    const merged = (current + " " + part).trim();
    if (current && merged.length > budget) {
      packed.push(current);
      current = part;
    } else {
      current = merged;
    }
  }
  if (current) packed.push(current);
  return packed;
}

/**
 * Split narration into caption-sized cues, breaking at sentence boundaries
 * first and clause (comma) boundaries second, so a cue never ends mid-phrase.
 */
function toCues(text) {
  const sentences = (text.match(/[^.?!]+[.?!]*\s*/g) ?? [text])
    .map((s) => s.trim())
    .filter(Boolean);

  const cues = [];
  for (const sentence of sentences) {
    if (sentence.length <= MAX_CUE_CHARS) {
      cues.push(sentence);
      continue;
    }
    // Keep commas attached to the clause they close, then pack clauses.
    const clauses = sentence
      .split(/(?<=,)\s+/)
      .flatMap((clause) =>
        clause.length <= MAX_CUE_CHARS
          ? [clause]
          : packParts(clause.split(" "), MAX_CUE_CHARS),
      );
    cues.push(...packParts(clauses, MAX_CUE_CHARS));
  }
  // Merge a stranded short tail back into its predecessor when it fits.
  return cues.reduce((acc, cue) => {
    const previous = acc[acc.length - 1];
    if (
      previous &&
      cue.length < 24 &&
      (previous + " " + cue).length <= MAX_CUE_CHARS
    ) {
      acc[acc.length - 1] = `${previous} ${cue}`;
      return acc;
    }
    acc.push(cue);
    return acc;
  }, []);
}

/** Wrap a cue to at most two balanced lines. */
function wrapCue(cue) {
  if (cue.length <= MAX_LINE_CHARS) return cue;
  const words = cue.split(" ");
  const target = Math.ceil(cue.length / 2);
  let first = "";
  for (const word of words) {
    if (first && (first + " " + word).length > target) break;
    first = (first + " " + word).trim();
  }
  return `${first}\n${cue.slice(first.length).trim()}`;
}

function srtTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, "0")}`;
}

/**
 * Cue timings are derived from each beat's narration audio duration, split
 * proportionally by character count — accurate enough to read naturally
 * without forced alignment, and exactly synced at every beat boundary.
 */
function buildCues(beats) {
  const cues = [];
  for (const { start, audioDuration, text } of beats) {
    const texts = toCues(text);
    const totalChars = texts.reduce((sum, cue) => sum + cue.length, 0);
    let cursor = start + LEAD_S;
    for (const cueText of texts) {
      const span = (cueText.length / totalChars) * audioDuration;
      cues.push({
        text: wrapCue(cueText),
        start: cursor,
        end: cursor + span - 0.04,
      });
      cursor += span;
    }
  }
  return cues;
}

function srtFrom(cues) {
  return cues
    .flatMap((cue, i) => [
      String(i + 1),
      `${srtTime(cue.start)} --> ${srtTime(cue.end)}`,
      cue.text,
      "",
    ])
    .join("\n");
}

/**
 * This ffmpeg build ships without libass/libfreetype, so captions are
 * rendered as brand-styled PNGs in headless Chromium and composited with
 * the overlay filter — which also gets us the product's real typeface.
 */
async function renderCaptionImages(cues) {
  const dir = `${BUILD}/captions`;
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 400 },
  });

  for (const [index, cue] of cues.entries()) {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet">
      <style>*{margin:0;box-sizing:border-box}
      body{background:transparent;display:flex;justify-content:center;align-items:flex-start}
      .cue{font-family:Inter,Helvetica,sans-serif;font-weight:600;font-size:40px;
        line-height:1.34;text-align:center;color:oklch(22% .015 265);
        background:#F7F6F2;padding:16px 30px;border-radius:12px;
        border:1px solid rgba(33,37,47,.10);
        max-width:1400px;white-space:pre-line}</style></head>
      <body><div class="cue">${cue.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></body></html>`,
      { waitUntil: "networkidle" },
    );
    await page
      .locator(".cue")
      .screenshot({ path: `${dir}/cue-${index}.png`, omitBackground: true });
  }

  await browser.close();
  return cues.map((cue, index) => ({ ...cue, png: `${dir}/cue-${index}.png` }));
}

/** Composite every cue PNG onto the master, each gated to its time window. */
function burnCaptions(master, cues, outFile) {
  const duration = probe(master);
  const inputs = ["-i", master];
  // `-loop 1` matters: a single-frame image input yields nothing to composite
  // once its one frame is consumed, so the overlay silently no-ops.
  for (const cue of cues) inputs.push("-loop", "1", "-i", cue.png);

  const chain = cues
    .map(
      (cue, i) =>
        `[${i === 0 ? "0:v" : `v${i}`}][${i + 1}:v]overlay=` +
        `x=(W-w)/2:y=H-h-56:enable='between(t,${cue.start.toFixed(2)},${cue.end.toFixed(2)})'` +
        `[v${i + 1}]`,
    )
    .join(";");

  ff([
    ...inputs,
    "-filter_complex", chain,
    "-map", `[v${cues.length}]`, "-map", "0:a",
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    // Looping inputs never end; the master's duration bounds the output.
    "-t", duration.toFixed(3),
    ...ENC, outFile,
  ]);
}

/* -------------------------------- assemble -------------------------------- */

await renderCards();

stillSegment(`${BUILD}/title.png`, TITLE_S, `${SEG}/seg-0.mp4`);
process.stdout.write(`seg-0  title card ${TITLE_S}s\n`);

const manifestPath = `${BUILD}/clips/manifest.json`;
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

const beats = [];
let timeline = TITLE_S;

for (let n = 1; n <= 8; n += 1) {
  const raw = `${BUILD}/clips/beat-${n}.webm`;
  const clip = shapeClip(raw, manifest[`beat-${n}`], `${BUILD}/clips/shaped-${n}.mp4`);
  const audio = `${BUILD}/n${n}.aiff`;
  const clipDuration = probe(clip);
  const audioDuration = probe(audio);
  const target = audioDuration + LEAD_S + TAIL_S;

  // Fit picture to narration. Running long: compress. Running short: stretch
  // gently first — a slightly slowed screen recording reads better than a
  // frozen frame — and only hold the last frame beyond that.
  let videoFilter;
  if (clipDuration >= target) {
    videoFilter = `setpts=PTS*${(target / clipDuration).toFixed(5)},fps=30`;
  } else if (target / clipDuration <= MAX_STRETCH) {
    videoFilter = `setpts=PTS*${(target / clipDuration).toFixed(5)},fps=30`;
  } else {
    const stretched = clipDuration * MAX_STRETCH;
    videoFilter =
      `setpts=PTS*${MAX_STRETCH},fps=30,` +
      `tpad=stop_mode=clone:stop_duration=${(target - stretched).toFixed(3)}`;
  }

  ff([
    "-i", clip, "-i", audio,
    "-filter_complex",
    `[0:v]${videoFilter}[v];[1:a]adelay=${Math.round(LEAD_S * 1000)}|${Math.round(LEAD_S * 1000)},apad[a]`,
    "-map", "[v]", "-map", "[a]", "-t", target.toFixed(3),
    ...ENC, `${SEG}/seg-${n}.mp4`,
  ]);

  beats.push({ start: timeline, audioDuration, text: NARRATION[n - 1] });
  timeline += target;
  process.stdout.write(
    `seg-${n}  ${clipDuration.toFixed(1)}s → ${target.toFixed(1)}s\n`,
  );
}

stillSegment(`${BUILD}/endcard.png`, ENDCARD_S, `${SEG}/seg-9.mp4`);
process.stdout.write(`seg-9  end card ${ENDCARD_S}s\n`);

const cues = buildCues(beats);
const srt = srtFrom(cues);
writeFileSync(`${BUILD}/captions.srt`, srt);
writeFileSync(`${OUT}/captions.srt`, srt);
process.stdout.write(`captions  ${cues.length} cues\n`);

writeFileSync(
  `${SEG}/list.txt`,
  Array.from({ length: 10 }, (_, i) => `file 'seg-${i}.mp4'`).join("\n"),
);
ff([
  "-f", "concat", "-safe", "0", "-i", `${SEG}/list.txt`,
  "-c", "copy", `${BUILD}/master.mp4`,
]);

// Clean master: loudness-normalized only (pair with captions.srt on YouTube).
ff([
  "-i", `${BUILD}/master.mp4`,
  "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
  ...ENC, `${OUT}/semester-autopilot-demo-nocaptions.mp4`,
]);

// Upload-safe master: captions burned in, styled to the product's palette.
const cueImages = await renderCaptionImages(cues);
burnCaptions(
  `${BUILD}/master.mp4`,
  cueImages,
  `${OUT}/semester-autopilot-demo.mp4`,
);

const finalPath = `${OUT}/semester-autopilot-demo.mp4`;
process.stdout.write(
  `\ndone → semester-autopilot-demo.mp4 (${probe(finalPath).toFixed(1)}s, captions burned in)\n` +
    `      → semester-autopilot-demo-nocaptions.mp4 + captions.srt\n`,
);
