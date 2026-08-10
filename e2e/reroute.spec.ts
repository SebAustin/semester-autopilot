import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await expect(
    page.getByRole("heading", { name: "This semester" }),
  ).toBeVisible();
});

test("marking a day busy reroutes its work; undo restores it", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Planner" }).click();
  await expect(page.getByRole("heading", { name: "Study plan" })).toBeVisible();

  // Find the first upcoming day that actually carries work.
  const loadedCell = page
    .locator("[data-date]")
    .filter({ has: page.getByTestId("study-block") })
    .first();
  await expect(loadedCell).toBeVisible();
  const date = await loadedCell.getAttribute("data-date");

  const cell = page.locator(`[data-date="${date}"]`);
  const before = Number(await cell.getAttribute("data-planned"));
  expect(before).toBeGreaterThan(0);

  await cell.getByRole("button", { name: /^Mark .* as busy$/ }).click();

  // The day empties and shows the rerouted state.
  await expect(cell.getByTestId("study-block")).toHaveCount(0);
  await expect(cell).toHaveAttribute("data-planned", "0");
  await expect(cell.getByText(/rerouted around this day/i)).toBeVisible();

  // Blackout persists through the store (survives reload).
  await page.reload();
  const reloaded = page.locator(`[data-date="${date}"]`);
  await expect(reloaded.getByTestId("study-block")).toHaveCount(0);

  // Undo restores capacity and the plan flows back.
  await reloaded.getByRole("button", { name: /^Unmark .* as busy$/ }).click();
  await expect
    .poll(async () => Number(await reloaded.getAttribute("data-planned")))
    .toBeGreaterThan(0);
});

test("what-if sliders move the projected grade live", async ({ page }) => {
  await page.getByRole("link", { name: /General Chemistry I/ }).click();
  await expect(
    page.getByRole("heading", { name: "Grade outlook" }),
  ).toBeVisible();

  const projected = page.getByTestId("projected-grade");
  const before = await projected.textContent();

  const slider = page
    .getByRole("slider", { name: /What-if score for/ })
    .first();
  await slider.focus();
  await page.keyboard.press("Home"); // drop the top-weight item to 0

  await expect.poll(async () => projected.textContent()).not.toBe(before);

  await page.getByRole("button", { name: "Reset what-ifs" }).click();
  await expect.poll(async () => projected.textContent()).toBe(before);
});
