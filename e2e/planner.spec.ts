import { expect, test } from "@playwright/test";

test("planner builds a plan from demo data and reacts to availability", async ({
  page,
}) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await expect(
    page.getByRole("heading", { name: "This semester" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Planner" }).click();
  await expect(page.getByRole("heading", { name: "Study plan" })).toBeVisible();

  // Demo data yields a non-empty plan.
  const blockCount = await page.getByTestId("study-block").count();
  expect(blockCount).toBeGreaterThan(3);
  await expect(page.getByTestId("plan-stats")).toContainText("planned");

  // Zero out Monday: every Monday cell must end up empty.
  const mondaySlider = page.getByRole("slider", { name: "Mon hours" });
  await mondaySlider.focus();
  await page.keyboard.press("Home");

  const mondayCells = page.locator('[data-weekday="Mon"]');
  const cellCount = await mondayCells.count();
  expect(cellCount).toBeGreaterThan(0);
  for (let i = 0; i < cellCount; i += 1) {
    await expect(mondayCells.nth(i).getByTestId("study-block")).toHaveCount(0);
  }
});
