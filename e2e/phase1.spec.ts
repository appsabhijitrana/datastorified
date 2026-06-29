import { expect, test } from "@playwright/test";
import { calculators as calculatorCatalog } from "@datastorified/calculators-engine";
import { tools as toolCatalog } from "@datastorified/tools-engine";

const website = "http://127.0.0.1:3000";
const calculators = "http://127.0.0.1:3001";
const tools = "http://127.0.0.1:3002";

test("website homepage loads", async ({ page }) => {
  await page.goto(website);
  await expect(page.getByRole("heading", { name: /Decision Intelligence/i })).toBeVisible();
});

test("decision input accepts text and shows preview", async ({ page }) => {
  await page.goto(website);
  await page.getByPlaceholder("Should I buy a house or keep renting?").fill("Should I buy an EV?");
  await page.getByRole("button", { name: /Explore/i }).first().click();
  await expect(page.getByRole("heading", { name: "Let’s make this decision measurable" })).toBeVisible();
});

test("calculators homepage loads and search finds EMI", async ({ page }) => {
  await page.goto(calculators);
  await expect(page.getByRole("heading", { name: /Smart calculators/i })).toBeVisible();
  await page.getByPlaceholder(/Search EMI/i).fill("EMI");
  await expect(page.getByRole("heading", { name: "EMI Calculator" })).toBeVisible();
});

test("EMI calculator calculates a known result", async ({ page }) => {
  await page.goto(`${calculators}/emi-calculator`);
  await page.getByRole("textbox", { name: "Loan amount", exact: true }).fill("120000");
  await page.getByRole("textbox", { name: "Annual interest rate", exact: true }).fill("0");
  await page.getByRole("textbox", { name: "Loan tenure", exact: true }).fill("1");
  await expect(page.getByText("₹10,000", { exact: true })).toBeVisible();
});

test("favorite calculator persists after reload", async ({ page }) => {
  await page.goto(`${calculators}/emi-calculator`);
  await page.getByRole("button", { name: "Favorite" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
});

test("recent calculator persists after reload", async ({ page }) => {
  await page.goto(`${calculators}/sip-calculator`);
  await page.goto(calculators);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Recently used" })).toBeVisible();
  await expect(page.locator("#recent").getByRole("heading", { name: "SIP Calculator" })).toBeVisible();
});

test("tools homepage loads and search finds JSON Formatter", async ({ page }) => {
  await page.goto(tools);
  await expect(page.getByRole("heading", { name: /Everyday tools/i })).toBeVisible();
  await page.getByPlaceholder(/Search JSON/i).fill("JSON Formatter");
  await expect(page.getByRole("heading", { name: "JSON Formatter", exact: true })).toBeVisible();
});

test("JSON Formatter formats valid JSON", async ({ page }) => {
  await page.goto(`${tools}/json-formatter`);
  await page.getByLabel("JSON Formatter input").fill('{"ready":true}');
  await expect(page.locator("pre")).toContainText('"ready": true');
});

test("JSON Formatter shows a friendly error for invalid JSON", async ({ page }) => {
  await page.goto(`${tools}/json-formatter`);
  await page.getByLabel("JSON Formatter input").fill("{");
  await expect(page.locator("div[role='alert']").filter({ hasText: /JSON|property|position/i })).toBeVisible();
});

test("Password Generator creates a new password", async ({ page }) => {
  await page.goto(`${tools}/password-generator`);
  const output = page.locator("pre"); const before = await output.textContent();
  await page.getByRole("button", { name: "Generate new" }).click();
  await expect(output).not.toHaveText(before ?? "");
});

test("mobile website renders bottom navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(website);
  await expect(page.locator("nav.fixed")).toBeVisible();
});

test("mobile calculator has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${calculators}/emi-calculator`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("mobile tool has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${tools}/json-formatter`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("legal pages load", async ({ page }) => {
  await page.goto(`${website}/legal/privacy`);
  await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
});

test("unknown routes return the 404 page", async ({ page }) => {
  const response = await page.goto(`${website}/route-that-does-not-exist`);
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});

test("every registered calculator and utility route responds successfully", async ({ request }) => {
  test.setTimeout(120_000);
  for (const calculator of calculatorCatalog) expect((await request.get(`${calculators}/${calculator.slug}`)).ok(), calculator.slug).toBe(true);
  for (const tool of toolCatalog) expect((await request.get(`${tools}/${tool.slug}`)).ok(), tool.slug).toBe(true);
});

test("representative pages produce no browser console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const url of [website, `${calculators}/emi-calculator`, `${tools}/json-formatter`, `${tools}/pdf-merge`, `${website}/legal/privacy`]) {
    await page.goto(url); await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
