import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate: zero critical or serious axe violations on every key
 * surface. Moderate/minor findings are reported in the console but don't
 * fail the build.
 */

async function auditPage(
  page: import("@playwright/test").Page,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const gating = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  const summary = gating.map(
    (v) =>
      `${v.impact}: ${v.id} — ${v.help} (${v.nodes.length} nodes: ${v.nodes[0]?.target})`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

test("landing has no serious a11y violations", async ({ page }) => {
  await page.goto("/");
  await auditPage(page);
});

test.describe("app surfaces with demo data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: /try with demo data/i }).click();
    await expect(
      page.getByRole("heading", { name: "This semester" }),
    ).toBeVisible();
  });

  test("semester view has no serious a11y violations", async ({ page }) => {
    await auditPage(page);
  });

  test("planner has no serious a11y violations", async ({ page }) => {
    await page.getByRole("link", { name: "Planner" }).click();
    await expect(page.getByRole("heading", { name: "Study plan" })).toBeVisible();
    await auditPage(page);
  });

  test("planner busy/conflict states have no serious a11y violations", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Planner" }).click();
    const loadedCell = page
      .locator("[data-date]")
      .filter({ has: page.getByTestId("study-block") })
      .first();
    // Pin the cell by date — the filtered locator is live and would match a
    // DIFFERENT still-loaded cell after the reroute empties this one.
    const date = await loadedCell.getAttribute("data-date");
    const cell = page.locator(`[data-date="${date}"]`);
    await cell.getByRole("button", { name: /^Mark .* as busy$/ }).click();
    await expect(page.getByText(/rerouted around this day/i)).toBeVisible();
    // Let exit animations finish — axe would otherwise measure the contrast
    // of half-faded popLayout clones and report phantom violations.
    await expect(cell.getByTestId("study-block")).toHaveCount(0);
    await page.waitForTimeout(600);
    await auditPage(page);
  });

  test("course page has no serious a11y violations", async ({ page }) => {
    await page.getByRole("link", { name: /General Chemistry I/ }).click();
    await expect(
      page.getByRole("heading", { name: "Grade outlook" }),
    ).toBeVisible();
    await auditPage(page);
  });

  test("ingest has no serious a11y violations", async ({ page }) => {
    await page.getByRole("link", { name: "Add courses" }).click();
    await expect(page.getByLabel("Course page URL")).toBeVisible();
    await auditPage(page);
  });
});
