import { expect, test } from "@playwright/test";
import { calculators as calculatorCatalog } from "@datastorified/calculators-engine";
import { tools as toolCatalog } from "@datastorified/tools-engine";

const website = "http://127.0.0.1:3000";
const calculators = "http://127.0.0.1:3001";
const tools = "http://127.0.0.1:3002";

test("website homepage loads", async ({ page }) => {
  await page.goto(website);
  await expect(page.getByRole("heading", { name: /Make the next move/i })).toBeVisible();
});

test("decision input accepts text and shows preview", async ({ page }) => {
  await page.goto(website);
  await page.getByLabel("What decision are you trying to make?").fill("Should I buy a house?");
  await page.getByRole("button", { name: /Analyze/i }).first().click();
  await expect(page).toHaveURL(/\/decision\/buy-house/u);
  await expect(page.getByRole("heading", { name: "Should I buy a house?" })).toBeVisible();
});

test("decision engine completes, changes scenario, saves, and reloads", async ({ page }) => {
  await page.goto(`${website}/decision/buy-house`);
  await page.getByRole("button", { name: /View recommendation/i }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ds.decisions.recent"))).not.toBeNull();
  await expect(page).toHaveURL(/\/decision\/result\//u);
  await expect(page.getByText("Recommendation", { exact: true })).toBeVisible();
  const resultUrl = page.url();
  const before = await page.locator('[aria-label^="Property price slider"]').inputValue();
  await page.locator('[aria-label^="Property price slider"]').fill(String(Number(before) + 500000));
  await expect(page.getByText(/points in this scenario|No score change/u)).toBeVisible();
  await page.getByRole("button", { name: /Save on this device/i }).click();
  await page.reload();
  await expect(page).toHaveURL(resultUrl);
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
});

for (const slug of ["sip-vs-fd", "ev-vs-petrol"]) test(`${slug} decision flow renders`, async ({ page }) => {
    await page.goto(`${website}/decision/${slug}`);
    await expect(page.getByRole("button", { name: /View recommendation/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

test("loaded decision flow completes while offline", async ({ page, context }) => {
  await page.goto(`${website}/decision/emergency-fund`);
  await context.setOffline(true);
  await page.getByRole("button", { name: /View recommendation/i }).click();
  await expect(page).toHaveURL(/\/decision\/result\//u);
  await expect(page.getByText("Recommendation", { exact: true })).toBeVisible();
  await context.setOffline(false);
});

test("mobile decision flow shows one question at a time without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${website}/decision/sip-vs-fd`);
  await expect(page.locator('main input[type="text"]:visible')).toHaveCount(1);
  await page.getByRole("button", { name: /Next question/i }).click();
  await expect(page.locator('main input[type="text"]:visible')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("calculators homepage loads and search finds EMI", async ({ page }) => {
  await page.goto(calculators);
  await expect(page.getByRole("heading", { name: /Smart calculators/i })).toBeVisible();
  await page.getByPlaceholder(/Search EMI/i).fill("EMI");
  await expect(page.getByRole("heading", { name: "EMI Calculator" })).toBeVisible();
});

test("calculator and tool search tolerate typos", async ({ page }) => {
  await page.goto(calculators); await page.getByPlaceholder(/Search EMI/i).fill("calclator"); await expect(page.getByRole("heading", { name: "Percentage Calculator" })).toBeVisible();
  await page.goto(tools); await page.getByPlaceholder(/Search JSON/i).fill("formater"); await expect(page.getByRole("heading", { name: "JSON Formatter", exact: true })).toBeVisible();
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
  await expect.poll(() => page.evaluate(() => localStorage.getItem("ds.recent.calculators"))).toContain("sip-calculator");
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

test("SEO, PWA, and crawler endpoints are production complete", async ({ request }) => {
  for (const origin of [website, calculators, tools]) {
    expect((await request.get(`${origin}/robots.txt`)).ok()).toBe(true);
    const sitemap = await request.get(`${origin}/sitemap.xml`); expect(sitemap.ok()).toBe(true); expect(await sitemap.text()).toContain("<urlset");
    const manifest = await request.get(`${origin}/manifest.webmanifest`); expect(manifest.ok()).toBe(true); expect((await manifest.json()).icons.length).toBeGreaterThanOrEqual(2);
    expect((await request.get(`${origin}/offline`)).ok()).toBe(true);
  }
});

test("product pages expose canonical, social, FAQ, breadcrumb, and application metadata", async ({ page }) => {
  await page.goto(`${calculators}/emi-calculator`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://calculators.datastorified.com/emi-calculator");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent(); expect(jsonLd).toContain("FAQPage"); expect(jsonLd).toContain("BreadcrumbList"); expect(jsonLd).toContain("SoftwareApplication");
});

test("decision URLs have canonical structured data and private results stay unindexed", async ({ page, request }) => {
  await page.goto(`${website}/decision`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://datastorified.com/decision");
  const landingSchemas = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "[]") as Array<{ "@type": string }>;
  expect(landingSchemas.map((schema) => schema["@type"])).toEqual(expect.arrayContaining(["CollectionPage", "BreadcrumbList"]));

  await page.goto(`${website}/decision/buy-house`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://datastorified.com/decision/buy-house");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/u);
  const flowSchemas = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "[]") as Array<{ "@type": string }>;
  expect(flowSchemas.map((schema) => schema["@type"])).toEqual(expect.arrayContaining(["FAQPage", "WebPage", "BreadcrumbList"]));

  const sitemap = await (await request.get(`${website}/sitemap.xml`)).text();
  expect(sitemap).toContain("https://datastorified.com/decision/buy-house");
  expect(sitemap).not.toContain("/decision/result/");
  const robots = await (await request.get(`${website}/robots.txt`)).text();
  expect(robots).not.toContain("Disallow: /decision/result");

  const privateResult = await request.get(`${website}/decision/result/seo-check`);
  expect(privateResult.headers()["x-robots-tag"]).toContain("noindex");
  await page.goto(`${website}/decision/result/seo-check`);
  const privateRobots = await page.locator('meta[name="robots"]').getAttribute("content");
  for (const directive of ["noindex", "nofollow", "noimageindex", "nosnippet"]) expect(privateRobots).toContain(directive);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("security headers protect every surface", async ({ request }) => {
  for (const origin of [website, calculators, tools]) { const response = await request.get(origin); expect(response.headers()["x-content-type-options"]).toBe("nosniff"); expect(response.headers()["x-frame-options"]).toBe("DENY"); expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'"); }
});

test("responsive layouts do not overflow at launch breakpoints", async ({ page }) => {
  for (const width of [320, 360, 390, 430, 768, 1024, 1440, 1920]) { await page.setViewportSize({width,height:900}); await page.goto(`${calculators}/emi-calculator`); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `overflow at ${width}px`).toBe(true); }
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
  page.on("pageerror", (error) => errors.push(error.message));
  for (const url of [website, `${calculators}/emi-calculator`, `${tools}/json-formatter`, `${tools}/pdf-merge`, `${website}/legal/privacy`]) {
    await page.goto(url); await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
