/**
 * Regenerates fixtures/cs-3110-syllabus.pdf from the text fixture.
 * Usage: node scripts/make-fixture-pdf.mjs
 */
import { readFileSync } from "node:fs";

import { chromium } from "@playwright/test";

const text = readFileSync("fixtures/cs-3110-syllabus.txt", "utf8")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;");

const html = `<!doctype html><html><body>
<pre style="font-family: Georgia, 'Times New Roman', serif; font-size: 11px; line-height: 1.5; white-space: pre-wrap;">${text}</pre>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({
  path: "fixtures/cs-3110-syllabus.pdf",
  format: "Letter",
  margin: { top: "0.8in", bottom: "0.8in", left: "0.9in", right: "0.9in" },
});
await browser.close();
process.stdout.write("PDF written to fixtures/cs-3110-syllabus.pdf\n");
