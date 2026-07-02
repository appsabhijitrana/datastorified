import { expect, test, type Page } from "@playwright/test";

const website = "http://127.0.0.1:3000";

async function assertNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("homepage loads", async ({ page }) => {
  await page.goto(website);
  await expect(page.getByRole("heading", { name: /What decision are you trying to make today/i })).toBeVisible();
  await expect(page.getByLabel("What decision are you trying to make today?")).toBeVisible();
});

test('searching "buy house" opens the buy-house workflow', async ({ page }) => {
  await page.goto(website);
  await page.getByLabel("What decision are you trying to make today?").fill("buy house");
  await page.getByRole("button", { name: /Find my decision/i }).click();
  await expect(page).toHaveURL(/\/decision\/property\/buy-house/u);
  await expect(page.getByRole("heading", { name: /Should I buy a house\?/i })).toBeVisible();
});

test("buy-house workflow accepts answers, scores, and recommends", async ({ page }) => {
  await page.goto(`${website}/decision/property/buy-house`);
  await page.getByRole("textbox", { name: "Monthly household take-home income" }).fill("180000");
  await page.getByRole("textbox", { name: "Property purchase price" }).fill("7500000");
  await page.getByRole("textbox", { name: "Available down payment" }).fill("2000000");
  await page.getByRole("button", { name: /View recommendation/i }).click();

  await page.waitForURL(/\/decision\/result\//u);
  await expect(page.getByText(/Live score/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Should I buy a house\?/i })).toBeVisible();
  await expect(page.locator("h2").filter({ hasText: "Proceed conditionally with buy the house" }).first()).toBeVisible();
});

test("scenario simulator changes the score and can be reset", async ({ page }) => {
  await page.goto(`${website}/decision/property/buy-house`);
  await page.getByRole("button", { name: /View recommendation/i }).click();
  await page.waitForURL(/\/decision\/result\//u);

  const noChange = page.getByText("No score change", { exact: true });
  await expect(noChange).toBeVisible();
  await page.getByRole("textbox", { name: "Monthly income" }).fill("300000");
  await expect(noChange).toBeHidden();
  await page.getByRole("button", { name: /Reset scenario/i }).click();
  await expect(noChange).toBeVisible();
});

test("saved decision persists after reload and saved page loads", async ({ page }) => {
  await page.goto(`${website}/decision/property/buy-house`);
  await page.getByRole("button", { name: /View recommendation/i }).click();
  await page.waitForURL(/\/decision\/result\//u);

  await page.getByRole("button", { name: /Save locally/i }).click();
  await expect(page.getByRole("button", { name: /Remove saved copy/i })).toBeVisible();
  const resultUrl = page.url();

  await page.reload();
  await expect(page).toHaveURL(resultUrl);
  await expect(page.getByRole("button", { name: /Remove saved copy/i })).toBeVisible();

  await page.goto(`${website}/decision/saved`);
  await expect(page.getByRole("heading", { name: /Saved decisions and drafts/i })).toBeVisible();
  await expect(page.getByText(/Saved locally/i)).toBeVisible();
});

for (const [plugin, slug, title] of [
  ["finance", "sip-vs-fd", /SIP or fixed deposit\?/i],
  ["automobile", "ev-vs-petrol", /EV or petrol car\?/i],
  ["career", "job-switch", /Should I switch jobs\?/i],
] as const) {
  test(`${slug} workflow opens and fits mobile viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${website}/decision/${plugin}/${slug}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator('main input[type="text"]:visible')).toHaveCount(1);
    await assertNoHorizontalOverflow(page);
  });
}

test("saved page empty state renders", async ({ page }) => {
  await page.goto(`${website}/decision/saved`);
  await expect(page.getByText(/No saved decisions yet/i)).toBeVisible();
});

test("invalid inputs surface validation errors", async ({ page }) => {
  await page.goto(`${website}/decision/property/buy-house`);
  const income = page.getByRole("textbox", { name: "Monthly household take-home income" });
  await income.fill("-1");
  await income.blur();
  await expect(page.locator('main [role="alert"]').first()).toBeVisible();
});

test("mobile homepage and decision pages do not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(website);
  await assertNoHorizontalOverflow(page);
  await page.goto(`${website}/decision/property/buy-house`);
  await assertNoHorizontalOverflow(page);
});
