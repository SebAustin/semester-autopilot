import { expect, test } from "@playwright/test";

test("landing renders and routes into the app", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /your semester, on autopilot/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Open the app" }).click();
  await expect(
    page.getByRole("heading", { name: /nothing on the radar yet/i }),
  ).toBeVisible();
});

test("demo data loads and survives reload", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await expect(page.getByRole("heading", { name: "This semester" })).toBeVisible();
  await expect(page.getByText("CS 2110").first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "This semester" })).toBeVisible();
  await expect(page.getByText("CS 2110").first()).toBeVisible();
});
