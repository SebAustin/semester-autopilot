import path from "node:path";

import { expect, test } from "@playwright/test";

test("link import scrapes (mock) and reaches review", async ({ page }) => {
  await page.goto("/app/ingest");
  await page
    .getByLabel("Course page URL")
    .fill("https://cs.example.edu/courses/3110");
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(/review what the AI read/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/dated deliverables ready/)).toBeVisible();
});

const REVIEW_HEADING = /your call on every row/i;

test("paste → review → commit adds the course to the semester", async ({
  page,
}) => {
  await page.goto("/app/ingest");

  await page
    .getByLabel(/paste the syllabus text/i)
    .fill(
      "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelims 30%, Final 25%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8.",
    );
  await page.getByRole("button", { name: "Extract deadlines" }).click();

  // Mocked extraction (LLM_MOCK=1) returns the CS 3110 fixture payload.
  await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
    timeout: 15_000,
  });

  // Honesty UX: null-dated rows are quarantined with the verbatim source text.
  await expect(page.getByText(/Week of Nov 16/i)).toBeVisible();
  await expect(page.getByText(/9 dated deliverables ready/)).toBeVisible();
  await expect(page.getByText(/2 still need a date/)).toBeVisible();

  await page.getByRole("button", { name: "Add to my semester" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("CS 3110").first()).toBeVisible();
});

test("PDF upload runs pdf.js in the browser and reaches review", async ({
  page,
}) => {
  await page.goto("/app/ingest");

  await page
    .locator('input[type="file"]')
    .setInputFiles(path.resolve("fixtures", "cs-3110-syllabus.pdf"));

  await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
    timeout: 20_000,
  });
});

test("editing a needs-a-date row promotes it into the dated list", async ({
  page,
}) => {
  await page.goto("/app/ingest");
  await page
    .getByLabel(/paste the syllabus text/i)
    .fill(
      "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelims 30%, Final 25%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8.",
    );
  await page.getByRole("button", { name: "Extract deadlines" }).click();
  await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
    timeout: 15_000,
  });

  const needsDate = page.getByRole("region", { name: "Needs a date" });
  await expect(needsDate.getByLabel("Due date")).toHaveCount(2);

  // Give the first undated row (the project milestone) a real date;
  // it should leave the amber bucket.
  await needsDate.getByLabel("Due date").first().fill("2026-11-18");

  await expect(page.getByText(/10 dated deliverables ready/)).toBeVisible();
  await expect(page.getByText(/1 still needs? a date/)).toBeVisible();
});
