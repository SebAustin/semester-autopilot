import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

test("demo semester: timeline renders, .ics exports, done-state persists", async ({
  page,
}) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await expect(
    page.getByRole("heading", { name: "This semester" }),
  ).toBeVisible();

  for (const chip of ["CS 2110", "HIST 2410", "CHEM 1310"]) {
    await expect(page.getByText(chip).first()).toBeVisible();
  }

  const tickCount = await page.getByTestId("timeline-tick").count();
  expect(tickCount).toBeGreaterThanOrEqual(20);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export .ics" }).click(),
  ]);
  const icsPath = await download.path();
  const ics = readFileSync(icsPath, "utf8");
  expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBeGreaterThanOrEqual(20);
  expect(ics).toContain("SUMMARY:CHEM 1310: Midterm 1");

  await page.getByRole("link", { name: /General Chemistry I/ }).click();
  await expect(
    page.getByRole("heading", { name: "General Chemistry I" }),
  ).toBeVisible();

  const doneToggle = page.getByLabel("Mark Quiz 3 as done");
  await doneToggle.check();
  await expect(doneToggle).toBeChecked();
  await page.getByLabel("Score for Quiz 3").fill("81");

  await page.reload();
  await expect(page.getByLabel("Mark Quiz 3 as done")).toBeChecked();
  await expect(page.getByLabel("Score for Quiz 3")).toHaveValue("81");
});
