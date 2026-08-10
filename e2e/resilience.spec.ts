import { expect, test } from "@playwright/test";

test("corrupted localStorage self-heals into a clean first-run state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "semester-autopilot-v1",
      '{"state":{"courses":{{{ definitely not json',
    );
  });

  await page.goto("/app");
  // No white screen, no crash — the designed empty state renders.
  await expect(
    page.getByRole("heading", { name: /nothing on the radar yet/i }),
  ).toBeVisible();

  // And the app is fully usable from here.
  await page.getByRole("button", { name: /try with demo data/i }).click();
  await expect(
    page.getByRole("heading", { name: "This semester" }),
  ).toBeVisible();
});

test("half-valid persisted state (old schema) still loads", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "semester-autopilot-v1",
      JSON.stringify({ state: { courses: {}, unknownField: 42 }, version: 1 }),
    );
  });
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: /nothing on the radar yet/i }),
  ).toBeVisible();
});
